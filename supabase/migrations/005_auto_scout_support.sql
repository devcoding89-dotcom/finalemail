-- Add support for Auto Scout Extension and different sending modes

-- Add current_index to campaigns to track auto-sending progress
ALTER TABLE campaigns ADD COLUMN current_index integer DEFAULT 0;

-- Add sending_mode to campaigns to store user preference
ALTER TABLE campaigns ADD COLUMN sending_mode text DEFAULT 'manual' CHECK (sending_mode IN ('manual', 'quick', 'auto'));

-- Add send_method to email_logs to track how each specific email was sent
ALTER TABLE email_logs ADD COLUMN send_method text DEFAULT 'manual' CHECK (send_method IN ('manual', 'mailto', 'auto_scout'));
