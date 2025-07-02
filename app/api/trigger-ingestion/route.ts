import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized (optional: add a secret token)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'your-secret-token'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Call the Supabase Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/news-ingestion`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        triggered_by: 'github-actions',
        timestamp: new Date().toISOString()
      })
    })

    const result = await response.text()
    
    if (!response.ok) {
      console.error('Ingestion failed:', response.status, result)
      return NextResponse.json({ 
        error: 'Ingestion failed', 
        status: response.status,
        details: result 
      }, { status: 500 })
    }

    console.log('Ingestion successful:', result)
    return NextResponse.json({ 
      success: true, 
      message: 'News ingestion triggered successfully',
      timestamp: new Date().toISOString(),
      details: result
    })

  } catch (error) {
    console.error('Error triggering ingestion:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
