const {GoogleGenAI}=require('@google/genai');
require('dotenv').config();

const ai=new GoogleGenAI({apiKey:"AIzaSyCKG8PA5_jVqQRNAT9C5vgPrSBzegEpd94"});

async function GenerateResponse(ShortMemory) {
    const response=await ai.models.generateContent({
        model:"gemini-2.5-flash",
        contents:ShortMemory
    })
    return response.text;
}
async function GenerateVector(contents) {
    const response=await ai.models.embedContent({
        model:"gemini-embedding-001",
        contents:contents,
        config:{
            outputDimensionality:768
        }
    })
    return response.embeddings[0].values;
}


module.exports={
    GenerateResponse,
    GenerateVector
};