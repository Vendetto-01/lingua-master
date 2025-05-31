const supabase = require('../config/supabase');

const authenticateUser = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid authorization token' 
      });
    }

    // Extract the token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid or expired' 
      });
    }

    // Add user info to request object
    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred while verifying authentication' 
    });
  }
};

module.exports = {
  authenticateUser
};