import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Configuration Check:');
console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Anon Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');

// Create client even if credentials are missing (with fallbacks)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

// Test connection only if we have valid credentials
if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co') {
  // Non-blocking connection test
  setTimeout(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('❌ Supabase connection error:', error.message);
      } else {
        console.log('✅ Supabase connected successfully');
      }
    }).catch((error) => {
      console.error('❌ Supabase connection failed:', error.message);
    });
  }, 100);
} else {
  console.warn('⚠️ Supabase credentials missing - running in offline mode');
}

// Check if Google OAuth is configured
export const checkGoogleOAuthConfig = async (): Promise<{ isConfigured: boolean; error?: string }> => {
  try {
    // Check if Supabase is properly configured
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
      return {
        isConfigured: false,
        error: 'Supabase is not properly configured. Please set up your Supabase project first.'
      };
    }

    // Try to get the auth configuration
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        isConfigured: false,
        error: `Supabase connection error: ${error.message}`
      };
    }

    // For now, we'll assume Google OAuth might be configured
    // In a real implementation, you'd check the auth providers endpoint
    return { isConfigured: true };
    
  } catch (error: any) {
    return {
      isConfigured: false,
      error: `Configuration check failed: ${error.message}`
    };
  }
};

// Enhanced Google Sign-In function with better redirect handling
export const signInWithGoogle = async (): Promise<{ data?: any; error?: any; needsSetup?: boolean }> => {
  try {
    console.log('🔐 Attempting Google Sign-In...');

    // First check if Supabase is configured
    const configCheck = await checkGoogleOAuthConfig();
    if (!configCheck.isConfigured) {
      return {
        error: { message: configCheck.error },
        needsSetup: true
      };
    }

    // Get the current origin for redirect URL
    const currentOrigin = window.location.origin;
    const redirectTo = `${currentOrigin}/login`;

    console.log('🔗 Redirect URL:', redirectTo);

    // Attempt Google OAuth sign-in with proper redirect URL
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        skipBrowserRedirect: false, // Allow browser redirect
      }
    });

    if (error) {
      console.error('❌ Google OAuth error:', error);
      
      // Handle specific Google OAuth errors
      if (error.message?.includes('not enabled') || error.message?.includes('provider')) {
        return {
          error: { 
            message: 'Google Sign-In is not enabled in Supabase. Please contact the administrator to enable Google OAuth provider.' 
          },
          needsSetup: true
        };
      } else if (error.message?.includes('redirect') || error.message?.includes('url')) {
        return {
          error: { 
            message: 'Google Sign-In redirect URL is not configured properly. Please contact the administrator.' 
          },
          needsSetup: true
        };
      } else if (error.message?.includes('client_id') || error.message?.includes('client')) {
        return {
          error: { 
            message: 'Google OAuth client is not configured. Please contact the administrator to set up Google OAuth credentials.' 
          },
          needsSetup: true
        };
      } else {
        return {
          error: { 
            message: `Google Sign-In failed: ${error.message}. Please try again or contact support.` 
          }
        };
      }
    }

    console.log('✅ Google Sign-In initiated successfully');
    return { data };

  } catch (err: any) {
    console.error('❌ Unexpected Google Sign-In error:', err);
    return {
      error: { 
        message: 'An unexpected error occurred with Google Sign-In. Please try again or use email/password login.' 
      }
    };
  }
};

// Handle OAuth callback
export const handleOAuthCallback = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ OAuth callback error:', error);
      return { error };
    }

    if (data.session) {
      console.log('✅ OAuth callback successful');
      return { data };
    }

    return { error: { message: 'No session found after OAuth callback' } };
  } catch (error: any) {
    console.error('❌ OAuth callback handling error:', error);
    return { error: { message: 'Failed to handle OAuth callback' } };
  }
};

// Database types
export interface User {
  id: string;
  email: string;
  name: string;
  university_id: string;
  mobile: string;
  gender: 'Male' | 'Female';
  role: 'student' | 'teacher' | 'admin';
  created_at: string;
}

export interface BusScheduleDB {
  id: string;
  time: string;
  starting_point: string;
  route: string;
  end_point: string;
  direction: string;
  gender?: 'Male' | 'Female';
  bus_type?: string;
  remarks?: string;
  description?: string;
  schedule_type: 'Regular' | 'Friday';
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: User;
}

export interface Complaint {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'delay' | 'safety' | 'driver_behavior' | 'bus_condition' | 'route_issue' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  bus_route?: string;
  incident_time?: string;
  created_at: string;
  resolved_at?: string;
  admin_response?: string;
  user?: User;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  published_at: string;
}