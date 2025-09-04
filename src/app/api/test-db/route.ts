import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Database Test Started ===');
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Test 1: Basic connection
    console.log('Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('google_tokens')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('Basic connection test failed:', testError);
      return NextResponse.json({ 
        success: false, 
        error: 'Basic connection failed',
        details: testError 
      });
    }
    
    console.log('Basic connection successful');
    
    // Test 2: Try to get table structure
    console.log('Testing table structure...');
    const { data: structureData, error: structureError } = await supabase
      .from('google_tokens')
      .select('*')
      .limit(0);
    
    if (structureError) {
      console.error('Table structure test failed:', structureError);
      return NextResponse.json({ 
        success: false, 
        error: 'Table structure test failed',
        details: structureError 
      });
    }
    
    console.log('Table structure test successful');
    
    // Test 3: Try to get user info (without requiring auth)
    console.log('Testing user info...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('No authenticated user found (this is expected for testing)');
      return NextResponse.json({ 
        success: true, 
        message: 'Database connection and structure tests passed',
        tests: ['connection', 'structure'],
        note: 'User authentication test skipped - no user session'
      });
    }
    
    console.log('Authenticated user found:', user.id);
    
    // Test 4: Try a simple insert with real user ID
    console.log('Testing simple insert...');
    const testInsertData = {
      user_id: user.id,
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      scope: 'test-scope'
    };
    
    const { error: insertError } = await supabase
      .from('google_tokens')
      .insert(testInsertData);
    
    if (insertError) {
      console.error('Insert test failed:', insertError);
      return NextResponse.json({ 
        success: false, 
        error: 'Insert test failed',
        details: insertError,
        testData: testInsertData
      });
    }
    
    console.log('Insert test successful');
    
    // Clean up
    const { error: deleteError } = await supabase
      .from('google_tokens')
      .delete()
      .eq('user_id', testInsertData.user_id);
    
    if (deleteError) {
      console.warn('Cleanup failed:', deleteError);
    } else {
      console.log('Cleanup successful');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'All database tests passed',
      tests: ['connection', 'structure', 'insert', 'cleanup']
    });
    
  } catch (error) {
    console.error('Database test exception:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Exception occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
