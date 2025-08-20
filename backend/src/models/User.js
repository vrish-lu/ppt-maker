import { supabase, TABLES } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export class User {
  static async create({ email, password, name }) {
    try {
      // Use Supabase Auth to create the user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: name,
          display_name: name
        }
      });

      if (authError) throw authError;

      // The trigger should automatically create the user profile
      // Wait a moment for the trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the created user profile
      const { data: profileData, error: profileError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Profile retrieval error:', profileError);
        // If profile doesn't exist, create it manually with service role
        const { data: newProfile, error: createError } = await supabase
          .from(TABLES.USERS)
          .insert([
            {
              id: authData.user.id,
              display_name: name,
              avatar_url: null,
              preferences: {
                email: email,
                password_hash: await bcrypt.hash(password, 12)
              },
              subscription_tier: 'free',
              api_usage_count: 0
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('Manual profile creation error:', createError);
          // If manual creation fails, delete the auth user
          await supabase.auth.admin.deleteUser(authData.user.id);
          throw createError;
        }

        return {
          user: {
            id: authData.user.id,
            email: email,
            name: name,
            display_name: name,
            created_at: newProfile.created_at,
            updated_at: newProfile.updated_at
          },
          token: authData.session?.access_token || null
        };
      }

      return {
        user: {
          id: authData.user.id,
          email: email,
          name: name,
          display_name: name,
          created_at: profileData.created_at,
          updated_at: profileData.updated_at
        },
        token: authData.session?.access_token || null
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      // Get user from Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error finding user by email:', authError);
        return null;
      }

      // Find user by email
      const authUser = authData.users.find(u => u.email === email);
      if (!authUser) {
        return null;
      }

      // Get user profile from public.users table
      const { data: profileData, error: profileError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        // If profile doesn't exist, return auth user data
        return {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email,
          display_name: authUser.user_metadata?.display_name || authUser.email,
          created_at: authUser.created_at,
          updated_at: authUser.updated_at,
          password_hash: null // We'll handle password verification differently
        };
      }

      return {
        id: profileData.id,
        email: authUser.email,
        name: profileData.display_name,
        display_name: profileData.display_name,
        bio: profileData.bio,
        company: profileData.company,
        role: profileData.role,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
        password_hash: profileData.preferences?.password_hash
      };
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  static async findById(id) {
    try {
      // Get user from Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(id);
      
      if (authError || !authData.user) {
        return null;
      }

      // Get user profile from public.users table
      const { data: profileData, error: profileError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) {
        // If profile doesn't exist, return auth user data
        return {
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.user_metadata?.name || authData.user.email,
          display_name: authData.user.user_metadata?.display_name || authData.user.email,
          created_at: authData.user.created_at,
          updated_at: authData.user.updated_at
        };
      }

      return {
        id: profileData.id,
        email: authData.user.email,
        name: profileData.display_name,
        display_name: profileData.display_name,
        bio: profileData.bio,
        company: profileData.company,
        role: profileData.role,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at
      };
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  static async update(id, updates) {
    try {
      // Prepare update object
      const updateData = {
        updated_at: new Date().toISOString()
      };

      // Add fields that are provided - fix field mapping
      if (updates.name) updateData.name = updates.name;  // Save to 'name' field
      if (updates.bio) updateData.bio = updates.bio;
      if (updates.company) updateData.company = updates.company;
      if (updates.role) updateData.role = updates.role;

      // Also update Supabase Auth user metadata if name changes
      if (updates.name) {
        try {
          await supabase.auth.admin.updateUserById(id, {
            user_metadata: { 
              name: updates.name,
              display_name: updates.name 
            }
          });
        } catch (authError) {
          console.warn('Failed to update auth metadata:', authError);
          // Continue with profile update even if auth update fails
        }
      }

      // Update profile in our users table
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async login({ email, password }) {
    try {
      // Use Supabase Auth for login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Get the user profile
      const { data: profileData, error: profileError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        // If profile doesn't exist, return auth user data
        return {
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email,
            display_name: data.user.user_metadata?.display_name || data.user.email,
            created_at: data.user.created_at,
            updated_at: data.user.updated_at
          },
          token: data.session.access_token
        };
      }

      return {
        user: {
          id: profileData.id,
          email: data.user.email,
          name: profileData.display_name,
          display_name: profileData.display_name,
          bio: profileData.bio,
          company: profileData.company,
          role: profileData.role,
          created_at: profileData.created_at,
          updated_at: profileData.updated_at
        },
        token: data.session.access_token
      };
    } catch (error) {
      console.error('Error logging in user:', error);
      throw error;
    }
  }
} 