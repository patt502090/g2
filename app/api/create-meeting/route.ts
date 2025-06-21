import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("Received meeting data:", body)

    // ส่งข้อมูลไปยัง webhook ผ่าน server-side
    const response = await fetch("https://g2.pupa-ai.com/webhook/9cf764fa-8824-4a5e-827b-2b94e9667d5c", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    console.log("Webhook response status:", response.status)

    // อ่าน response body
    let responseData
    const responseText = await response.text()
    console.log("Webhook response body:", responseText)

    try {
      responseData = responseText ? JSON.parse(responseText) : {}
    } catch (e) {
      responseData = { rawResponse: responseText }
    }

    if (!response.ok) {
      console.error("Webhook error:", {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      })

      return NextResponse.json(
        {
          error: `Webhook error: ${response.status} ${response.statusText}`,
          details: responseText,
        },
        { status: response.status },
      )
    }

    // ส่งข้อมูลกลับไปยัง client
    return NextResponse.json({
      success: true,
      ...responseData,
    })
  } catch (error) {
    console.error("API Route error:", error)

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// เพิ่ม OPTIONS method สำหรับ CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
