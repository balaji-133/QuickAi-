
// helps to check user is premium or free plan user

import { clerkClient } from "@clerk/express";

export const auth = async(req,response,next)=>{
    try{
        const {userId,has}=await req.auth();
        const hasPremiumPlan = await has({plan: 'premium'});
        const user = await clerkClient.users.getUser(userId);
        if(!hasPremiumPlan && user.privateMetadata.free_usage){
            req.free_usage = user.privateMetadata.free_usage;
        }
        else{
            await clerkClient.users.updateUserMetadata(userId,{
                privateMetadata:{
                    free_usage: 0
                }
            })
            req.free_usage = 0;
        }
        req.plan=hasPremiumPlan ? 'premium' : 'free';
        next();
    }
    catch(error){
        console.error('Error in auth middleware:', error);
        response.json({success:false,message:error.message });
    }
}