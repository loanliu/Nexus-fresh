import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { categoryId, categoryName, categoryDescription } = await request.json();

    if (!categoryId || !categoryName) {
      return NextResponse.json(
        { success: false, error: 'Category ID and name are required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not configured, using mock data');
      const mockSubcategories = generateMockSubcategories(categoryName);
      return NextResponse.json({
        success: true,
        subcategories: mockSubcategories.slice(0, 7) // Limit to 7
      });
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Generate subcategories using real AI
    const prompt = `Generate exactly 7 relevant subcategories for the category "${categoryName}".
${categoryDescription ? `Category description: ${categoryDescription}` : ''}

Return a JSON array of objects with this exact structure:
[
  {
    "name": "Subcategory Name",
    "description": "Brief description of what this subcategory covers"
  }
]

Requirements:
- Generate exactly 7 subcategories
- Each subcategory should be specific and actionable
- Avoid overlapping or redundant subcategories
- Keep names concise (2-4 words max)
- Descriptions should be 1-2 sentences max
- Focus on practical, commonly used subcategories
- Return only the JSON array, no other text or markdown formatting`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates relevant subcategories for organizational purposes. Always respond with valid JSON only, no markdown formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    
    if (!responseText) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse the AI response
    let aiSubcategories;
    try {
      aiSubcategories = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      // Fallback to mock data if AI response is malformed
      const mockSubcategories = generateMockSubcategories(categoryName);
      return NextResponse.json({
        success: true,
        subcategories: mockSubcategories.slice(0, 7)
      });
    }

    // Validate and limit the response
    if (!Array.isArray(aiSubcategories)) {
      throw new Error('AI response is not an array');
    }

    // Ensure we have exactly 7 subcategories
    const limitedSubcategories = aiSubcategories.slice(0, 7);

    return NextResponse.json({
      success: true,
      subcategories: limitedSubcategories
    });

  } catch (error) {
    console.error('Error generating subcategories:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate subcategories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateMockSubcategories(categoryName: string) {
  // Generate intelligent mock subcategories based on category name (limited to 7)
  const categoryLower = categoryName.toLowerCase();
  
  // Common subcategory patterns based on category type
  if (categoryLower.includes('tech') || categoryLower.includes('development') || categoryLower.includes('programming')) {
    return [
      { name: "Frontend Development", description: "UI/UX, React, Vue, Angular, and client-side technologies" },
      { name: "Backend Development", description: "Server-side logic, APIs, databases, and infrastructure" },
      { name: "Mobile Development", description: "iOS, Android, React Native, and mobile app development" },
      { name: "DevOps & Deployment", description: "CI/CD, cloud services, containers, and deployment strategies" },
      { name: "Data & Analytics", description: "Data science, machine learning, and analytics tools" },
      { name: "Security", description: "Cybersecurity, authentication, and data protection practices" },
      { name: "AI & Machine Learning", description: "Artificial intelligence, neural networks, and ML frameworks" }
    ];
  }
  
  if (categoryLower.includes('business') || categoryLower.includes('management')) {
    return [
      { name: "Strategy & Planning", description: "Business strategy, planning, and decision-making processes" },
      { name: "Project Management", description: "Project planning, execution, and team coordination" },
      { name: "Marketing & Sales", description: "Customer acquisition, branding, and sales strategies" },
      { name: "Finance & Accounting", description: "Financial planning, budgeting, and accounting practices" },
      { name: "Human Resources", description: "Hiring, team management, and employee development" },
      { name: "Operations", description: "Business operations, processes, and efficiency improvements" },
      { name: "Leadership", description: "Management skills, leadership development, and team building" }
    ];
  }
  
  if (categoryLower.includes('design') || categoryLower.includes('creative')) {
    return [
      { name: "UI/UX Design", description: "User interface and user experience design principles" },
      { name: "Graphic Design", description: "Visual design, branding, and graphic creation" },
      { name: "Web Design", description: "Website design, responsive layouts, and web aesthetics" },
      { name: "Prototyping", description: "Design prototypes, wireframes, and mockups" },
      { name: "Design Systems", description: "Component libraries, style guides, and design consistency" },
      { name: "Tools & Software", description: "Design tools, software, and workflow optimization" },
      { name: "Typography", description: "Font selection, text design, and typographic principles" }
    ];
  }

  if (categoryLower.includes('marketing') || categoryLower.includes('sales')) {
    return [
      { name: "Content Marketing", description: "Blog posts, articles, and educational content creation" },
      { name: "Social Media", description: "Social media strategy, posting, and engagement" },
      { name: "Email Marketing", description: "Email campaigns, newsletters, and automation" },
      { name: "SEO & SEM", description: "Search engine optimization and search marketing" },
      { name: "Analytics", description: "Marketing metrics, tracking, and performance analysis" },
      { name: "Lead Generation", description: "Prospecting, lead capture, and conversion strategies" },
      { name: "Branding", description: "Brand identity, messaging, and visual consistency" }
    ];
  }

  if (categoryLower.includes('health') || categoryLower.includes('fitness') || categoryLower.includes('wellness')) {
    return [
      { name: "Nutrition", description: "Diet planning, healthy eating, and nutritional guidance" },
      { name: "Exercise & Training", description: "Workout routines, fitness programs, and physical training" },
      { name: "Mental Health", description: "Stress management, mindfulness, and emotional wellbeing" },
      { name: "Sleep & Recovery", description: "Sleep optimization, rest, and recovery strategies" },
      { name: "Preventive Care", description: "Health screenings, checkups, and preventive measures" },
      { name: "Lifestyle", description: "Healthy habits, work-life balance, and lifestyle choices" },
      { name: "Medical Resources", description: "Healthcare information, medical references, and resources" }
    ];
  }
  
  // Default generic subcategories
  return [
    { name: "Getting Started", description: "Basic concepts and introductory materials" },
    { name: "Best Practices", description: "Proven methods and recommended approaches" },
    { name: "Advanced Topics", description: "Complex concepts and advanced techniques" },
    { name: "Tools & Resources", description: "Useful tools, software, and helpful resources" },
    { name: "Case Studies", description: "Real-world examples and practical applications" },
    { name: "Tips & Tricks", description: "Quick tips, shortcuts, and helpful techniques" },
    { name: "Reference", description: "Documentation, guides, and reference materials" }
  ];
}
