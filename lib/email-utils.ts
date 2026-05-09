// Email validation utility

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const trimmed = email.trim().toLowerCase()
  if (trimmed.length > 254) return false
  return EMAIL_REGEX.test(trimmed)
}

export function cleanEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Extract a best-guess name from an email address.
 * e.g. "john.doe@company.com" → "John Doe"
 */
export function guessNameFromEmail(email: string): string | null {
  const localPart = email.split('@')[0]
  if (!localPart) return null

  // Common separators: . _ -
  const parts = localPart.split(/[._-]/)

  // Filter out numbers-only parts and very short parts
  const nameParts = parts.filter(
    (p) => p.length > 1 && !/^\d+$/.test(p)
  )

  if (nameParts.length === 0) return null

  // Capitalize each part
  return nameParts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Extract a best-guess company from the email domain.
 * e.g. "user@bigcorp.com" → "Bigcorp"
 * Skips common free email providers.
 */
const FREE_PROVIDERS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'aol.com', 'icloud.com', 'mail.com', 'protonmail.com',
  'zoho.com', 'yandex.com', 'live.com', 'msn.com',
  'gmx.com', 'fastmail.com',
])

export function guessCompanyFromEmail(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null

  if (FREE_PROVIDERS.has(domain)) return null

  // Take the domain name without TLD
  const companyPart = domain.split('.')[0]
  if (!companyPart || companyPart.length < 2) return null

  return companyPart.charAt(0).toUpperCase() + companyPart.slice(1)
}

/**
 * Find the email column from CSV headers (case-insensitive) or by scanning data.
 */
export function findEmailColumn(headers: string[], sampleRow?: any): string | null {
  const emailAliases = ['email', 'e-mail', 'email_address', 'emailaddress', 'mail', 'email address', 'contact email', 'recipient', 'to']
  
  // 1. Try exact or partial header match
  for (const header of headers) {
    const h = header.trim().toLowerCase()
    if (emailAliases.includes(h) || h.includes('email')) {
      return header
    }
  }

  // 2. Fallback: Scan sample data for something that looks like an email
  if (sampleRow) {
    for (const [key, value] of Object.entries(sampleRow)) {
      if (typeof value === 'string' && validateEmail(value)) {
        return key
      }
    }
  }

  return null
}

/**
 * Find the name column from CSV headers.
 */
export function findNameColumn(headers: string[]): string | null {
  const nameAliases = ['name', 'full_name', 'fullname', 'full name', 'contact_name', 'contact name', 'first_name', 'firstname', 'first name']
  for (const header of headers) {
    if (nameAliases.includes(header.trim().toLowerCase())) {
      return header
    }
  }
  return null
}

/**
 * Find the company column from CSV headers.
 */
export function findCompanyColumn(headers: string[]): string | null {
  const companyAliases = ['company', 'company_name', 'companyname', 'company name', 'organization', 'org', 'organisation']
  for (const header of headers) {
    if (companyAliases.includes(header.trim().toLowerCase())) {
      return header
    }
  }
  return null
}
