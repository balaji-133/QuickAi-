import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import {v2 as cloudinary} from "cloudinary";
import fs from "fs"
import pdf from 'pdf-parse/lib/pdf-parse.js'

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 15) {
      return res.json({
        success: false,
        message:
          "You have reached your free usage limit. Please upgrade to premium.",
      });
    }
    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: length,
    });

    const content = response.choices[0].message.content;

    await sql` INSERT INTO creations (user_id,prompt,content,type) 
    VALUES (${userId}, ${prompt}, ${content}, 'article') `;

    if(plan != "premium"){
        await clerkClient.users.updateUserMetadata(userId,{
            privateMetadata:{
                free_usage: free_usage + 1
            }
        }
        )
    }
    res.json({
      success: true,
      message: "Article generated successfully",
      content
    });
  } catch (err) {
    console.log(err.message);
    res.json({
        success:false,message:err.message
    })
  }
};


export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 15) {
      return res.json({
        success: false,
        message:
          "You have reached your free usage limit. Please upgrade to premium.",
      });
    }
    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const content = response.choices[0].message.content;

    await sql` INSERT INTO creations (user_id,prompt,content,type) 
    VALUES (${userId}, ${prompt}, ${content}, 'blog-title') `;

    if(plan != "premium"){
        await clerkClient.users.updateUserMetadata(userId,{
            privateMetadata:{
                free_usage: free_usage + 1
            }
        }
        )
    }
    res.json({
      success: true,
      message: "Article generated successfully",
      content
    });
  } catch (err) {
    console.log(err.message);
    res.json({
        success:false,message:err.message
    })
  }
};

export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message:
          "Features is available for only premium users",
      });
    }
    
    const formData = new FormData()
    formData.append('prompt',prompt)
    const {data}=await axios.post("https://clipdrop-api.co/text-to-image/v1",formData,{
      headers:{'x-api-key':process.env.CLIP_DROP_API_KEY},
      responseType:"arraybuffer",
    })

    const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`;

    const { secure_url } = await cloudinary.uploader.upload(base64Image);


    await sql` INSERT INTO creations (user_id,prompt,content,type,publish) 
    VALUES (${userId}, ${prompt}, ${secure_url}, 'image',${publish ?? false}) `;

    res.json({
      success: true,
      message: "Article generated successfully",
      content:secure_url
    });
  } catch (err) {
    console.log(err.message);
    res.json({
        success:false,message:err.message
    })
  }
};

// export const removeImageBackground = async (req, res) => {
//   try {
//     const { userId } = req.auth();
//     const image  = req.file;
//     const plan = req.plan;

//     if (plan !== "premium") {
//       return res.json({
//         success: false,
//         message:
//           "Features is available for only premium users",
//       });
//     }

//     const { secure_url } = await cloudinary.uploader.upload(image.path,{
//       transformation:[{
//         effect:'background_removal',
//         background_removal:'remove_the_background'
//       }]
//     });


//     await sql` INSERT INTO creations (user_id,prompt,content,type) 
//     VALUES (${userId},'Remove Background From Image', ${secure_url}, 'image') `;

//     res.json({
//       success: true,
//       message: "Article generated successfully",
//       content:secure_url
//     });

//   } catch (err) {
//     console.log(err.message);
//     res.json({
//         success:false,message:err.message
//     })
//   }
// };

export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const plan = req.plan;
    const image = req.file;

    console.log("🔍 PLAN:", plan);
    console.log("📷 FILE:", image);

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "Feature is available for premium users only",
      });
    }

    if (!image) {
      return res.json({
        success: false,
        message: "No image uploaded",
      });
    }

    let uploadResult;
    try {
      uploadResult = await cloudinary.uploader.upload(image.path, {
        transformation: [{
          effect: "background_removal",
          background_removal: "remove_the_background"
        }]
      });

      console.log("✅ Cloudinary upload:", uploadResult);
    } catch (err) {
      console.error("❌ Cloudinary error:", err);
      return res.json({
        success: false,
        message: "Cloudinary upload failed",
      });
    }

    const { secure_url } = uploadResult;

    if (!secure_url) {
      return res.json({
        success: false,
        message: "No secure_url returned from Cloudinary",
      });
    }

    await sql`INSERT INTO creations (user_id, prompt, content, type) 
      VALUES (${userId}, 'Remove Background From Image', ${secure_url}, 'image')`;

    res.json({
      success: true,
      content: secure_url,
      message: "Background removed successfully",
    });
  } catch (err) {
    console.error("❌ Server error:", err.message);
    res.json({
      success: false,
      message: err.message || "Something went wrong",
    });
  }
};

// export const removeImageObject = async (req, res) => {
//   try {
//     const { userId } = req.auth();
//     const {object} = req.body();
//     const image  = req.file;
//     const plan = req.plan;

//     if (plan !== "premium") {
//       return res.json({
//         success: false,
//         message:
//           "Features is available for only premium users",
//       });
//     }

//     const { public_id } = await cloudinary.uploader.upload(image.path);

//     const imageUrl=cloudinary.url(public_id,{
//       transformation:[
//         {
//           effect:`gen_remove:${object}`
//         }
//       ],
//       resource_type:'image'
//     })


//     await sql` INSERT INTO creations (user_id,prompt,content,type) 
//     VALUES (${userId},${`Removed ${object} from image`}, ${secure_url}, 'image') `;

//     res.json({
//       success: true,
//       message: "Article generated successfully",
//       content:imageUrl
//     });
    
//   } catch (err) {
//     console.log(err.message);
//     res.json({
//         success:false,message:err.message
//     })
//   }
// };

export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const image = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "Feature is available only for premium users",
      });
    }

    if (!image || !object) {
      return res.json({
        success: false,
        message: "Missing image or object name",
      });
    }

    // Step 1: Upload to Cloudinary
    const { public_id } = await cloudinary.uploader.upload(image.path);

    // Step 2: Apply object removal transformation
    const imageUrl = cloudinary.url(public_id, {
      transformation: [
        {
          effect: `gen_remove:${object}`, // Ensure this is supported in your plan
        },
      ],
      resource_type: 'image',
    });

    // Step 3: Save to DB
    await sql`
      INSERT INTO creations (user_id, prompt, content, type) 
      VALUES (
        ${userId}, 
        ${`Removed ${object} from image`}, 
        ${imageUrl}, 
        'image'
      )
    `;

    res.json({
      success: true,
      message: "Object removed successfully",
      content: imageUrl,
    });

  } catch (err) {
    console.log("Remove object error:", err.message);
    res.json({
      success: false,
      message: err.message,
    });
  }
};


export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth();
    const resume = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message:
          "Features is available for only premium users",
      });
    }

    if(resume.size > 5*1024*1024){
      return res.json({success:false,message:"Resume file size exceeds allowed size (5MB)"})
    }

    const dataBuffer = fs.readFileSync(resume.path)

    const pdfData = await pdf(dataBuffer)

    const prompt = `Review the following resume and provide constructive feedback on its strengths,weaknesses , and areas for improvements,Also make corrections and give ats score and best suggestions ever . Resume Content : \n\n${pdfData.text}`

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content


    await sql` INSERT INTO creations (user_id,prompt,content,type) 
    VALUES (${userId},'Review the uploaded resume', ${content}, 'resume-review') `;

    res.json({
      success: true,
      message: "Article generated successfully",
      content
    });
    
  } catch (err) {
    console.log(err.message);
    res.json({
        success:false,message:err.message
    })
  }
};