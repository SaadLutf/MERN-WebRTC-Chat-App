import API from "./Api";

export const getUserById=(id)=>{
    return API.get(`/user/${id}`)
}

// edit user info

export const editUserInfoApi=(data)=>{
    return API.put("/user/update-info",data)
}

// upload profile image

export const setProfileImageApi=(formData)=>{
    return API.put('/user/update-profile-image',formData);
}