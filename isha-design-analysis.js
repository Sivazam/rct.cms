const ZAI = require('z-ai-web-dev-sdk');

async function analyzeIshaDesign() {
  try {
    const zai = await ZAI.create();
    
    const searchResult = await zai.functions.invoke("web_search", {
      query: "isha sadhguru org website design colors earthy orange brown minimalist aesthetic",
      num: 10
    });
    
    console.log('=== ISHA FOUNDATION DESIGN ANALYSIS ===');
    console.log(JSON.stringify(searchResult, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

analyzeIshaDesign();