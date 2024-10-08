const headers = {
  origin: "api.spotifydown.com",
  referer: "api.spotifydown.com",
};

export const getTrackMetaData = async (id: string) => {
  const response = await fetch(`https://api.spotifydown.com/metadata/track/${id}`, { headers: headers });
  return await response.json();
};

export const getPlayListMetaData = async (path: string) => {
  const response = await fetch(`https://api.spotifydown.com/metadata${path}`, { headers: headers });
  return await response.json();
};

export const getTrackUrl = async (id: string) => {
  const response = await fetch(`https://api.spotifydown.com/getId/${id}`, {
    headers: headers,
  });
  const tmp = await response.text();
  console.log(tmp);
  const res = await response.json();
  const { id: ytId } = res;
  return ytId;
};

export const getPlayListUrl = async (path: string) => {
  const response = await fetch(`https://api.spotifydown.com/trackList${path}`, {
    headers: headers,
  });
  const { trackList } = await response.json();
  return trackList;
};
