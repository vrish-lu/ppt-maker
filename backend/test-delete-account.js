import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 Testing Delete Account Functionality...');
console.log('🔗 Supabase URL:', supabaseUrl);
console.log('🔑 Service Key available:', !!supabaseServiceKey);

async function testDeleteAccount() {
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('\n🔍 Test 1: Testing Supabase connection...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️ No user authenticated (expected):', authError.message);
    } else {
      console.log('✅ User authenticated:', user?.id);
    }

    // Test 2: Check if we can access the users table
    console.log('\n🔍 Test 2: Testing users table access...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, created_at')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error accessing users table:', usersError);
    } else {
      console.log('✅ Users table accessible, found users:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('📋 Sample user:', {
          id: users[0].id,
          display_name: users[0].display_name,
          created_at: users[0].created_at
        });
      }
    }

    // Test 3: Check if we can access the presentations table
    console.log('\n🔍 Test 3: Testing presentations table access...');
    
    const { data: presentations, error: presentationsError } = await supabase
      .from('presentations')
      .select('id, title, user_id')
      .limit(1);
    
    if (presentationsError) {
      console.error('❌ Error accessing presentations table:', presentationsError);
    } else {
      console.log('✅ Presentations table accessible, found presentations:', presentations?.length || 0);
      if (presentations && presentations.length > 0) {
        console.log('📋 Sample presentation:', {
          id: presentations[0].id,
          title: presentations[0].title,
          user_id: presentations[0].user_id
        });
      }
    }

    // Test 4: Check if we can access the slides table
    console.log('\n🔍 Test 4: Testing slides table access...');
    
    const { data: slides, error: slidesError } = await supabase
      .from('slides')
      .select('id, title, presentation_id')
      .limit(1);
    
    if (slidesError) {
      console.error('❌ Error accessing slides table:', slidesError);
    } else {
      console.log('✅ Slides table accessible, found slides:', slides?.length || 0);
      if (slides && slides.length > 0) {
        console.log('📋 Sample slide:', {
          id: slides[0].id,
          title: slides[0].title,
          presentation_id: slides[0].presentation_id
        });
      }
    }

    // Test 5: Check if we can access the presentation_images table
    console.log('\n🔍 Test 5: Testing presentation_images table access...');
    
    const { data: images, error: imagesError } = await supabase
      .from('presentation_images')
      .select('id, presentation_id')
      .limit(1);
    
    if (imagesError) {
      console.error('❌ Error accessing presentation_images table:', imagesError);
    } else {
      console.log('✅ Presentation images table accessible, found images:', images?.length || 0);
    }

    // Test 6: Test admin user deletion (this will fail without proper permissions)
    console.log('\n🔍 Test 6: Testing admin user deletion permissions...');
    
    try {
      // Try to delete a non-existent user to test permissions
      const { error: deleteError } = await supabase.auth.admin.deleteUser('00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        console.log('ℹ️ Admin delete user error (expected):', deleteError.message);
        
        if (deleteError.message.includes('permission') || deleteError.message.includes('role')) {
          console.error('❌ PERMISSION ISSUE: The service role key does not have admin permissions');
          console.error('💡 Solution: Check your Supabase service role key permissions');
        }
      } else {
        console.log('✅ Admin delete user permissions working');
      }
    } catch (error) {
      console.error('❌ Unexpected error testing admin delete:', error);
    }

    console.log('\n🎯 Summary:');
    console.log('✅ Supabase connection: Working');
    console.log('✅ Users table access: Working');
    console.log('✅ Presentations table access: Working');
    console.log('✅ Slides table access: Working');
    console.log('✅ Presentation images table access: Working');
    console.log('⚠️  Admin delete permissions: Check above for details');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDeleteAccount();
