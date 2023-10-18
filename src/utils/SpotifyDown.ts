const headers = {
  authority: "api.spotifydown.com",
  origin: "api.spotifydown.com",
  referer: "api.spotifydown.com",
};

export const getTrackMetaData = async (id: string) => {
  const response = await fetch(
    `https://api.spotifydown.com/metadata/track/${id}`,
    { headers: headers }
  );
  return await response.json();
};

export const getPlayListMetaData = async (id: string) => {
  const response = await fetch(
    `https://api.spotifydown.com/metadata/playlist/${id}`,
    { headers: headers }
  );
  return await response.json();
};

export const getTrackUrl = async (id: string) => {
  const response = await fetch(`https://api.spotifydown.com/getId/${id}`, {
    headers: headers,
  });
  const { id: ytId } = await response.json();
  return ytId;
};

export const getPlayListUrl = async (id: string) => {
  const response = await fetch(`https://api.spotifydown.com/trackList/playlist/${id}`, {
    headers: headers,
  });
  const { trackList } = await response.json();
  return trackList;
};
