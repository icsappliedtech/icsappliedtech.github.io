// After successful authentication, create a session or generate a token
const sessionData = {
    username: 'username',
    isAuthenticated: true
  };
  const sessionToken = btoa(JSON.stringify(sessionData)); // Encode the session data as a base64 string
  document.cookie = `session=${sessionToken}; path=/;`; // Store the session token as a cookie

// Check if the session or token is present and valid
const sessionCookie = document.cookie.split(';').find(cookie => cookie.startsWith('session='));
if (!sessionCookie) {
  // Session cookie not found, redirect the user to the login page
  window.location.href = '/';
} else {
  const sessionToken = sessionCookie.split('=')[1];
  try {
    const sessionData = JSON.parse(atob(sessionToken)); // Decode the session token and parse the JSON data
    if (!sessionData.isAuthenticated) {
      // User is not authenticated, redirect to the login page
      window.location.href = '/';
    }
  } catch (error) {
    // Invalid session token, redirect to the login page
    window.location.href = '/';
  }
}
