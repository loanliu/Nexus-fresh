// Input Validator for AI Feedback
// Prevents spam and validates input quality

interface ValidationResult {
  isValid: boolean;
  reason?: string;
  score: number; // 0-100, higher is better
}

class InputValidator {
  private readonly minLength = 10;
  private readonly maxLength = 1000;
  private readonly spamPatterns: RegExp[];
  private readonly qualityPatterns: RegExp[];

  constructor() {
    this.spamPatterns = [
      /(.)\1{4,}/g, // Repeated characters (aaaaa)
      /(.)\1{2,}/g, // Repeated characters (aaa)
      /[^\w\s.,!?\-]/g, // Special characters
      /\b(viagra|casino|poker|lottery|winner|congratulations)\b/gi, // Spam keywords
      /\b(click here|buy now|free money|earn cash)\b/gi, // Marketing spam
    ];

    this.qualityPatterns = [
      /\b(problem|issue|bug|error|suggestion|improvement|feature|request)\b/gi, // Good feedback words
      /\b(like|love|hate|dislike|prefer|wish|want|need)\b/gi, // Opinion words
      /\b(work|function|perform|behave|act|respond)\b/gi, // Action words
      /\b(interface|design|layout|navigation|button|menu)\b/gi, // UI words
    ];
  }

  validate(feedback: string): ValidationResult {
    // Basic length check
    if (feedback.length < this.minLength) {
      return {
        isValid: false,
        reason: `Feedback too short. Minimum ${this.minLength} characters required.`,
        score: 0
      };
    }

    if (feedback.length > this.maxLength) {
      return {
        isValid: false,
        reason: `Feedback too long. Maximum ${this.maxLength} characters allowed.`,
        score: 0
      };
    }

    // Spam detection
    const spamScore = this.detectSpam(feedback);
    if (spamScore > 0.3) { // 30% spam threshold
      return {
        isValid: false,
        reason: 'Feedback appears to be spam or low quality.',
        score: 0
      };
    }

    // Quality scoring
    const qualityScore = this.calculateQuality(feedback);
    
    if (qualityScore < 20) {
      return {
        isValid: false,
        reason: 'Feedback is too generic. Please provide more specific details.',
        score: qualityScore
      };
    }

    return {
      isValid: true,
      score: qualityScore
    };
  }

  private detectSpam(text: string): number {
    let spamScore = 0;
    
    // Check for repeated characters
    const repeatedChars = text.match(this.spamPatterns[0]) || [];
    spamScore += repeatedChars.length * 0.1;
    
    // Check for spam keywords
    const spamKeywords = text.match(this.spamPatterns[3]) || [];
    spamScore += spamKeywords.length * 0.2;
    
    // Check for marketing spam
    const marketingSpam = text.match(this.spamPatterns[4]) || [];
    spamScore += marketingSpam.length * 0.2;
    
    // Check for excessive special characters
    const specialChars = text.match(this.spamPatterns[2]) || [];
    spamScore += (specialChars.length / text.length) * 0.5;
    
    return Math.min(spamScore, 1); // Cap at 1.0
  }

  private calculateQuality(text: string): number {
    let score = 0;
    
    // Base score for length
    score += Math.min(text.length / 50, 20); // Max 20 points for length
    
    // Check for quality patterns
    this.qualityPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      score += matches.length * 5; // 5 points per quality word
    });
    
    // Bonus for specific feedback types
    if (text.includes('?')) score += 5; // Questions are good
    if (text.includes('because')) score += 10; // Explanations are good
    if (text.includes('suggest') || text.includes('recommend')) score += 10; // Suggestions are good
    
    // Penalty for very short sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
      if (avgLength < 20) score -= 10; // Penalty for very short sentences
    }
    
    return Math.min(Math.max(score, 0), 100); // Cap between 0-100
  }
}

export const inputValidator = new InputValidator();
