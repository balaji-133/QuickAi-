import sql from "../configs/db.js";



export const getUserCreations = async (req,res) => {
  try{
    const {userId} = req.auth()

    const creations = await sql`SELECT * FROM creations WHERE user_id = ${userId} ORDER BY created_at DESC`;

    res.json({success:true,creations})

  } 
  catch(err){
    res.json({success:false,message:err.message});
  } 
}

export const getPublishedCreations = async (req,res) => {
  try{

    const creations = await sql`SELECT * FROM creations WHERE publish = true ORDER BY created_at DESC`;

    res.json({success:true,creations})

  } 
  catch(err){
    res.json({success:false,message:err.message});
  } 
}

export const toggleLikeCreations = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const [creation] = await sql`SELECT * FROM creations WHERE id = ${id}`;
    if (!creation) {
      return res.json({ success: false, message: "Creation not found" });
    }

    const currentLikes = creation.likes || [];
    const userIdStr = userId.toString();

    let updatedLikes;
    let message;

    if (currentLikes.includes(userIdStr)) {
      updatedLikes = currentLikes.filter((uid) => uid !== userIdStr);
      message = "Nachakapothey neku nachindi create chesuko"; // unlike
    } else {
      updatedLikes = [...currentLikes, userIdStr];
      message = "Ahha nachinda like chesavu"; // like
    }

    // Convert array to PostgreSQL array syntax: '{a,b,c}'
    const formattedLikesArray = `{${updatedLikes.join(',')}}`;

    await sql`
      UPDATE creations
      SET likes = ${formattedLikesArray}::text[]
      WHERE id = ${id}
    `;

    res.json({ success: true, message });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};
