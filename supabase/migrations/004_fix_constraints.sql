-- Fix foreign key constraints to allow deleting templates used in campaigns
-- Run this in Supabase SQL Editor

-- First, drop the existing constraint
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_template_id_fkey;

-- Re-add it with ON DELETE CASCADE or SET NULL
-- Using SET NULL is safer if you want to keep the campaign data
-- But we need to make template_id nullable first
ALTER TABLE campaigns ALTER COLUMN template_id DROP NOT NULL;

ALTER TABLE campaigns 
ADD CONSTRAINT campaigns_template_id_fkey 
FOREIGN KEY (template_id) 
REFERENCES templates(id) 
ON DELETE SET NULL;

-- Also fix email_logs to contacts constraint just in case
ALTER TABLE email_logs DROP CONSTRAINT IF EXISTS email_logs_contact_id_fkey;

ALTER TABLE email_logs
ADD CONSTRAINT email_logs_contact_id_fkey
FOREIGN KEY (contact_id)
REFERENCES contacts(id)
ON DELETE CASCADE;
