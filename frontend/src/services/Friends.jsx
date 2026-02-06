import API from "./Api";


// send friend request

export const sendFriendRequest = async (userId) => {
  const { data } = await API.post(`/friends/request/${userId}`);
  return data;
};

/**
 * Cancel Sent Friend Request
 */
export const cancelFriendRequest = async (userId) => {
  const { data } = await API.delete(`/friends/cancel/${userId}`);
  return data;
};

/**
 * Accept Friend Request
 */
export const acceptFriendRequest = async (requestId) => {
  const { data } = await API.post(`/friends/accept/${requestId}`);
  return data;
};

/**
 * Reject Friend Request
 */
export const rejectFriendRequest = async (requestId) => {
  const { data } = await API.post(`/friends/reject/${requestId}`);
  return data;
};
/**
 * Get Pending Friend Requests
 */
export const getPendingRequests = async () => {
  const { data } = await API.get(`/friends/requests`);
  return data;
};

/**
 * Get Friend List
 */
export const getFriendList = async () => {
  const { data } = await API.get(`/friends/list`);
  return data;
};

/**
 * Search Users with Pagination + Status
 */
export const searchUsers = async (query, page = 1, limit = 10) => {
  const { data } = await API.get(`/friends/search`, {
    params: { q: query, page, limit },
  });
  return data;
};
/**
 * Unfriend a User
 */
export const unfriendUser = async (userId) => {
  const { data } = await API.delete(`/friends/unfriend/${userId}`);
  return data;
};