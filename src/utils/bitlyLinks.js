const BITLY_API_BASE_URL = 'https://api-ssl.bitly.com/v4';

const bitlyRequest = async ({ accessToken, path, method = 'GET', body }) => {
  const response = await fetch(`${BITLY_API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Bitly request failed.');
  }

  return response.json();
};

export const fetchBitlyGroups = async ({ accessToken }) => {
  const response = await bitlyRequest({
    accessToken,
    path: '/groups'
  });

  return Array.isArray(response.groups) ? response.groups : [];
};

export const resolveDefaultBitlyGroupAndDomain = async ({ accessToken }) => {
  const groups = await fetchBitlyGroups({ accessToken });
  const preferredGroup = groups.find((group) => group?.is_active) ?? groups[0] ?? null;
  const groupGuid = typeof preferredGroup?.guid === 'string' ? preferredGroup.guid : '';
  const defaultDomain =
    Array.isArray(preferredGroup?.bsds) && preferredGroup.bsds.length > 0
      ? preferredGroup.bsds[0]
      : 'bit.ly';

  return {
    groupGuid,
    domain: defaultDomain
  };
};

export const createBitlyShortLink = async ({ accessToken, longUrl, groupGuid, domain }) => {
  const payload = {
    long_url: longUrl,
    domain: domain || 'bit.ly'
  };

  if (groupGuid) {
    payload.group_guid = groupGuid;
  }

  const response = await bitlyRequest({
    accessToken,
    path: '/shorten',
    method: 'POST',
    body: payload
  });

  if (typeof response.link !== 'string' || !response.link) {
    throw new Error('Bitly did not return a shortened link.');
  }

  return response.link;
};
