-- Create clicks table for affiliate link tracking
CREATE TABLE IF NOT EXISTS clicks (
  id SERIAL PRIMARY KEY,
  asin VARCHAR(20) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_clicks_asin ON clicks(asin);
CREATE INDEX IF NOT EXISTS idx_clicks_timestamp ON clicks(timestamp);
CREATE INDEX IF NOT EXISTS idx_clicks_asin_timestamp ON clicks(asin, timestamp);

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_clicks_date ON clicks(DATE(timestamp));
