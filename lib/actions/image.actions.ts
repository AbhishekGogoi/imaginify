//implement server actions that will call cloudinary's API for image transformation actions

"use server";

import { redirect } from "next/navigation";
import Image from "../database/models/image.model";
import User from "../database/models/user.model";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";

const populateUser = (query: any) =>
  query.populate({
    path: "author",
    model: User,
    select: "_id firstName lastName clerkId",
  });

//ADD IMAGE to DB

export async function addImage({ image, userId, path }: AddImageParams) {
  try {
    await connectToDatabase();

    // connect a specific image to an author who created it
    const author = await User.findById(userId);

    if (!author) {
      throw new Error("User not found");
    }

    // new Image created and added to databse
    const newImage = await Image.create({
      ...image,
      author: author._id,
    });

    revalidatePath(path);

    // return a newly created image that we added to the database
    return JSON.parse(JSON.stringify(newImage));
    // allow us to show the new image that was created and not just keep what was cached
    // rather revalidate the path to show the new added image
  } catch (error) {
    handleError(error);
  }
}

//Update Image

export async function updateImage({ image, userId, path }: UpdateImageParams) {
  try {
    await connectToDatabase();

    // find the image to update
    const imageToUpdate = await Image.findById(image._id);

    // check whether the image exists or whether the user has permission to update the image
    if (!imageToUpdate || imageToUpdate.author.toHexString() !== userId) {
      throw new Error("Unauthorized or image not found");
    }

    const updatedImage = await Image.findByIdAndUpdate(
      imageToUpdate._id,
      image,
      //   creating a new instance of that document
      { new: true }
    );

    revalidatePath(path);

    return JSON.parse(JSON.stringify(updatedImage));
  } catch (error) {
    handleError(error);
  }
}

// Delete Image

export async function deleteImage(imageId: string) {
  try {
    await connectToDatabase();

    await Image.findByIdAndDelete(imageId);
  } catch (error) {
    handleError(error);
  } finally {
    redirect("/");
  }
}

// GET IMAGE BY ID
export async function getImageById(imageId: string) {
  try {
    await connectToDatabase();

    // we dont want to simply get the data of the image, we want to
    // get the data of the author that created the image as well.
    // below we are getting which user created the image and we are populating that image
    // so now it also contains the data about the user that created it
    const image = await populateUser(Image.findById(imageId));

    if (!image) throw new Error("Image not found");

    return JSON.parse(JSON.stringify(image));
  } catch (error) {
    handleError(error);
  }
}

//GET ALL IMAGES
export async function getAllImages({
  limit = 9,
  page = 1,
  searchQuery = "",
}: {
  limit?: number;
  page: number;
  searchQuery?: string;
}) {
  try {
    await connectToDatabase();

    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    let expression = "folder=imaginify";

    if (searchQuery) {
      expression += ` AND ${searchQuery}`;
    }

    //gives back all the resources we need
    const { resources } = await cloudinary.search
      .expression(expression)
      .execute();

    const resourceIds = resources.map((resource: any) => resource.public_id);

    //forming our new query
    let query = {};

    //modifying the query search that we only got back from cloudinary
    //if searchQuery  exists, coming from frontend then modify the 'query'
    if (searchQuery) {
      query = {
        //go over the public ID's
        publicId: {
          //go over the public ID's including the resource ID's
          $in: resourceIds,
        },
      };
    }

    //limit is limit of cards per page
    const skipAmount = (Number(page) - 1) * limit;

    //finally fetch the images
    //populateUser is used because we also want to get the user data
    const images = await populateUser(Image.find(query))
      // newer ones appear on top
      .sort({ updatedAt: -1 })
      // for pagination
      .skip(skipAmount)
      .limit(limit);

    //define the number of total images
    const totalImages = await Image.find(query).countDocuments();
    //get the total number of all images in general
    const savedImages = await Image.find().countDocuments();

    return {
      data: JSON.parse(JSON.stringify(images)),
      //to calculate how many total pages there are
      totalPage: Math.ceil(totalImages / limit),
      savedImages,
    };
  } catch (error) {
    handleError(error);
  }
}

//GET IMAGES BY USER

export async function getUserImages({
  limit = 9,
  page = 1,
  userId,
}: {
  limit?: number;
  page: number;
  userId: string;
}) {
  try {
    await connectToDatabase();

    const skipAmount = (Number(page) - 1) * limit;

    const images = await populateUser(Image.find({ author: userId }))
      .sort({ updatedAt: -1 })
      .skip(skipAmount)
      .limit(limit);

    const totalImages = await Image.find({ author: userId }).countDocuments();

    return {
      data: JSON.parse(JSON.stringify(images)),
      totalPages: Math.ceil(totalImages / limit),
    };
  } catch (error) {
    handleError(error);
  }
}
