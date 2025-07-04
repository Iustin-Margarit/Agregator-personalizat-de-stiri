# Premium Features Guide: Enhanced Saved Articles Limits

## Overview
This guide explains how to extend the current 50-article limit system to support premium users with higher limits.

## Current Implementation
✅ **Base System (Completed)**
- 50 saved articles limit for all users
- Automatic FIFO cleanup (oldest articles removed first)
- Real-time count tracking
- Performance-optimized with proper indexing

## Premium Extension Strategy

### 1. Database Schema Updates

#### Add Premium Status to Profiles
```sql
-- Migration: Add premium fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS saved_articles_limit INTEGER DEFAULT 50;

-- Create enum for premium tiers
CREATE TYPE premium_tier_enum AS ENUM ('free', 'premium', 'pro', 'enterprise');
ALTER TABLE profiles ALTER COLUMN premium_tier TYPE premium_tier_enum USING premium_tier::premium_tier_enum;

-- Update saved articles limits based on tier
UPDATE profiles SET saved_articles_limit = CASE 
    WHEN premium_tier = 'free' THEN 50
    WHEN premium_tier = 'premium' THEN 200
    WHEN premium_tier = 'pro' THEN 500
    WHEN premium_tier = 'enterprise' THEN 1000
    ELSE 50
END;
```

#### Update Limit Enforcement Function
```sql
-- Enhanced function that checks user's premium tier
CREATE OR REPLACE FUNCTION enforce_saved_articles_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    user_limit INTEGER;
    oldest_article_id UUID;
BEGIN
    -- Get user's current limit based on premium tier
    SELECT 
        COALESCE(p.saved_articles_limit, 50) INTO user_limit
    FROM profiles p 
    WHERE p.id = NEW.user_id;
    
    -- If no profile found, use default limit
    IF user_limit IS NULL THEN
        user_limit := 50;
    END IF;
    
    -- Count current saved articles for this user
    SELECT COUNT(*) INTO current_count
    FROM saved_articles 
    WHERE user_id = NEW.user_id;
    
    -- If at or over limit, remove oldest saved article(s)
    WHILE current_count >= user_limit LOOP
        -- Find the oldest saved article for this user
        SELECT article_id INTO oldest_article_id
        FROM saved_articles 
        WHERE user_id = NEW.user_id
        ORDER BY saved_at ASC
        LIMIT 1;
        
        -- Delete the oldest saved article
        DELETE FROM saved_articles 
        WHERE user_id = NEW.user_id AND article_id = oldest_article_id;
        
        -- Update count
        current_count := current_count - 1;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Premium Tier Configuration

#### Recommended Limits
```typescript
export const PREMIUM_TIERS = {
  free: {
    name: 'Free',
    savedArticlesLimit: 50,
    price: 0,
    features: ['Basic article saving', 'Email notifications']
  },
  premium: {
    name: 'Premium',
    savedArticlesLimit: 200,
    price: 9.99, // monthly
    features: ['200 saved articles', 'Priority support', 'Advanced filters']
  },
  pro: {
    name: 'Pro',
    savedArticlesLimit: 500,
    price: 19.99, // monthly
    features: ['500 saved articles', 'API access', 'Custom categories']
  },
  enterprise: {
    name: 'Enterprise',
    savedArticlesLimit: 1000,
    price: 49.99, // monthly
    features: ['1000 saved articles', 'Team features', 'Analytics dashboard']
  }
} as const;
```

### 3. Frontend Implementation

#### Premium Status Component
```typescript
// components/premium/premium-status.tsx
import { useUser } from '@/hooks/use-user';
import { PREMIUM_TIERS } from '@/lib/premium-config';

export function PremiumStatus() {
  const { user, profile } = useUser();
  const tier = profile?.premium_tier || 'free';
  const limit = PREMIUM_TIERS[tier].savedArticlesLimit;
  
  return (
    <div className="premium-status">
      <span className="tier-badge">{PREMIUM_TIERS[tier].name}</span>
      <span className="limit-info">
        {savedCount}/{limit} articles saved
      </span>
      {tier === 'free' && (
        <button onClick={() => router.push('/upgrade')}>
          Upgrade for more saves
        </button>
      )}
    </div>
  );
}
```

#### Upgrade Flow
```typescript
// app/upgrade/page.tsx
export default function UpgradePage() {
  return (
    <div className="upgrade-page">
      <h1>Choose Your Plan</h1>
      {Object.entries(PREMIUM_TIERS).map(([key, tier]) => (
        <PricingCard 
          key={key}
          tier={key}
          {...tier}
          onSelect={() => handleUpgrade(key)}
        />
      ))}
    </div>
  );
}
```

### 4. Backend Integration

#### Subscription Management
```typescript
// lib/subscription.ts
export async function upgradePremium(userId: string, tier: string) {
  const { error } = await supabase
    .from('profiles')
    .update({
      premium_tier: tier,
      premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      saved_articles_limit: PREMIUM_TIERS[tier].savedArticlesLimit
    })
    .eq('id', userId);
    
  if (error) throw error;
}

export async function checkPremiumStatus(userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('premium_tier, premium_expires_at, saved_articles_limit')
    .eq('id', userId)
    .single();
    
  const isExpired = profile?.premium_expires_at && 
    new Date(profile.premium_expires_at) < new Date();
    
  if (isExpired) {
    // Downgrade to free tier
    await downgradePremium(userId);
    return { tier: 'free', limit: 50 };
  }
  
  return {
    tier: profile?.premium_tier || 'free',
    limit: profile?.saved_articles_limit || 50
  };
}
```

### 5. Payment Integration

#### Stripe Integration Example
```typescript
// lib/stripe.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createSubscription(userId: string, priceId: string) {
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_URL}/premium/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/upgrade`,
    metadata: { userId, tier: 'premium' }
  });
  
  return session.url;
}
```

### 6. Migration Path

#### Step-by-Step Implementation
1. **Phase 1**: Add premium fields to database
2. **Phase 2**: Update limit enforcement function
3. **Phase 3**: Build premium UI components
4. **Phase 4**: Integrate payment system
5. **Phase 5**: Add subscription management
6. **Phase 6**: Test and deploy

#### Database Migration
```sql
-- Run this migration to add premium support
-- Migration: 20250705000000_add_premium_support.sql

-- Add premium fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS saved_articles_limit INTEGER DEFAULT 50;

-- Update the limit enforcement function (see above)
-- ... (include the enhanced function here)

-- Create index for premium queries
CREATE INDEX IF NOT EXISTS profiles_premium_tier_idx ON profiles (premium_tier);
CREATE INDEX IF NOT EXISTS profiles_premium_expires_idx ON profiles (premium_expires_at);
```

## Benefits of This Approach

### ✅ Scalable Architecture
- Easy to add new tiers
- Flexible limit configuration
- Backward compatible

### ✅ Performance Optimized
- Efficient database queries
- Proper indexing
- Minimal overhead for free users

### ✅ User Experience
- Clear upgrade path
- Real-time limit tracking
- Graceful limit enforcement

### ✅ Business Model Ready
- Multiple pricing tiers
- Subscription management
- Payment integration ready

## Testing Premium Features

```javascript
// Test premium limits
const testPremiumLimits = async () => {
  // Test free user (50 limit)
  await testUserLimit('free-user-id', 50);
  
  // Test premium user (200 limit)
  await testUserLimit('premium-user-id', 200);
  
  // Test tier upgrade
  await upgradePremium('free-user-id', 'premium');
  await testUserLimit('free-user-id', 200); // Should now have 200 limit
};
```

## Next Steps

1. **Decide on pricing strategy** and tier structure
2. **Choose payment provider** (Stripe, PayPal, etc.)
3. **Design premium UI/UX** components
4. **Implement database migrations** for premium support
5. **Build subscription management** system
6. **Test thoroughly** with different scenarios
7. **Deploy incrementally** with feature flags

This system is designed to be **production-ready** and **scalable** for your news aggregator's growth! 🚀