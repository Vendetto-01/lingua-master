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
      console.error('Auth error:', error);
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid or expired',
        details: error?.message 
      });
    }

    // ÖNEMLI: user_id'yi doğru şekilde set et
    req.user = {
      user_id: user.id, // Bu satır önemli!
      id: user.id,
      email: user.email,
      ...user
    };

    console.log('✅ User authenticated:', {
      user_id: req.user.user_id,
      email: req.user.email
    });

    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred while verifying authentication',
      details: error.message 
    });
  }
};

module.exports = {
  authenticateUser
};