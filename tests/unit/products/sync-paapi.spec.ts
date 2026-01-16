import { describe, it, expect, vi, beforeEach } from 'vitest'
import { syncProductsWithPaapi } from '@/services/products/sync-paapi'
import { GetItems } from '@/services/amazon-paapi-edge'

// Mock external dependencies
vi.mock('@/services/amazon-paapi-edge', () => ({
  GetItems: vi.fn(),
}))

describe('syncProductsWithPaapi', () => {
  let mockPayload: any

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock Payload object
    mockPayload = {
      find: vi.fn(),
      update: vi.fn(),
    }
    // Setup environment variables needed
    process.env.PAAPI_ACCESS_KEY = 'test-key'
    process.env.PAAPI_SECRET_KEY = 'test-secret'
    process.env.PAAPI_PARTNER_TAG = 'test-tag'
  })

  it('should return early if no pending products are found', async () => {
    // Arrange
    mockPayload.find.mockResolvedValue({
      totalDocs: 0,
      docs: [],
    })

    // Act
    const result = await syncProductsWithPaapi(mockPayload)

    // Assert
    expect(result.processed).toBe(0)
    expect(result.message).toBe('No pending products found')
    expect(mockPayload.find).toHaveBeenCalledTimes(1)
    expect(mockPayload.update).not.toHaveBeenCalled()
  })

  it('should return error if products have no valid ASINs', async () => {
    // Arrange
    mockPayload.find.mockResolvedValue({
      totalDocs: 2,
      docs: [
        { id: '1', asin: null },
        { id: '2', asin: '' },
      ],
    })

    // It should first mark them as PROCESSING
    mockPayload.update.mockResolvedValue({})

    // Act
    const result = await syncProductsWithPaapi(mockPayload)

    // Assert
    // Verify it changed status to PROCESSING
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['1', '2'] } },
        data: { status: 'PROCESSING' },
      }),
    )

    // Returned result
    expect(result.processed).toBe(2)
    expect(result.errors).toBe(2)
    expect(result.message).toContain('No valid ASINs')
  })

  it('should process successful PAAPI response', async () => {
    // Arrange
    const products = [
      { id: 'p1', asin: 'ASIN1', image: 'old.jpg' },
      { id: 'p2', asin: 'ASIN2', image: 'old.jpg' },
    ]
    mockPayload.find.mockResolvedValue({
      totalDocs: products.length,
      docs: products,
    })

    const mockItems = [
      { ASIN: 'ASIN1', Images: { Primary: { Large: { URL: 'new1.jpg' } } } },
      { ASIN: 'ASIN2', Images: { Primary: { Large: { URL: 'new2.jpg' } } } },
    ]

    vi.mocked(GetItems).mockResolvedValue({
      ItemsResult: {
        Items: mockItems,
        Errors: [],
      },
    })

    // Act
    const result = await syncProductsWithPaapi(mockPayload)

    // Assert
    expect(result.success).toBe(2)
    expect(result.errors).toBe(0) // Note: The code adds errors.length to errors logic

    // Check updates
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'p1',
        data: expect.objectContaining({
          status: 'COMPLETED',
          image: 'new1.jpg',
        }),
      }),
    )
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'p2',
        data: expect.objectContaining({
          status: 'COMPLETED',
          image: 'new2.jpg',
        }),
      }),
    )
  })

  it('should handle PAAPI errors correctly', async () => {
    // Arrange
    const products = [{ id: 'p1', asin: 'ASIN_ERR' }]
    mockPayload.find.mockResolvedValue({
      totalDocs: 1,
      docs: products,
    })

    vi.mocked(GetItems).mockRejectedValue(new Error('Network Error'))

    // Act
    const result = await syncProductsWithPaapi(mockPayload)

    // Assert
    expect(result.success).toBe(0)
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['p1'] } }, // Revert to ERROR
        data: expect.objectContaining({ status: 'ERROR' }),
      }),
    )
    expect(result.message).toContain('PAAPI Request Failed')
  })

  it('should handle partial success and specific item errors', async () => {
    // Arrange
    const products = [
      { id: 'p1', asin: 'SUCCESS_ASIN' },
      { id: 'p2', asin: 'INVALID_ASIN' },
      { id: 'p3', asin: 'MISSING_ASIN' },
    ]
    mockPayload.find.mockResolvedValue({
      totalDocs: 3,
      docs: products,
    })

    vi.mocked(GetItems).mockResolvedValue({
      ItemsResult: {
        Items: [{ ASIN: 'SUCCESS_ASIN', ItemInfo: { Title: { DisplayValue: 'Test' } } }],
        Errors: [
          { ASIN: 'INVALID_ASIN', Code: 'InvalidParameterValue', Message: 'Invalid' },
          // Simulating error where ASIN is not in property but in Message
          { Code: 'ItemNotAccessible', Message: 'ItemId MISSING_ASIN is not accessible' },
        ],
      },
    })

    // Act
    const result = await syncProductsWithPaapi(mockPayload)

    // Assert
    expect(result.success).toBe(1)

    // Verify p1 success
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'p1',
        data: expect.objectContaining({ status: 'COMPLETED' }),
      }),
    )

    // Verify p2 treated as COMPLETED but inactive for InvalidParameterValue (as per code logic)
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'p2',
        data: expect.objectContaining({
          status: 'NOT_FOUND',
          active: false,
          message: 'Product not found',
        }),
      }),
    )

    // Verify p3 treated as ERROR for ItemNotAccessible
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'p3',
        data: expect.objectContaining({
          status: 'ERROR',
          active: false,
          message: 'Product not accessible',
        }),
      }),
    )
  })

  it('should handle case where item is simply missing in response', async () => {
    // Arrange
    const products = [{ id: 'p1', asin: 'GHOST_ASIN' }]
    mockPayload.find.mockResolvedValue({
      totalDocs: 1,
      docs: products,
    })

    vi.mocked(GetItems).mockResolvedValue({
      ItemsResult: {
        Items: [],
        Errors: [],
      },
    })

    // Act
    const result = await syncProductsWithPaapi(mockPayload)

    // Assert
    expect(result.success).toBe(0)
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'p1',
        data: expect.objectContaining({
          status: 'ERROR',
          message: 'ASIN not returned in PAAPI response',
        }),
      }),
    )
  })
})
