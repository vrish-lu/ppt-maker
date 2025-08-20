import { supabase, TABLES } from '../config/supabase.js';

export class Presentation {
  static async create({ userId, title, description, themeId, amountOfText, imageSource, imageStyle, slideCount, slides, metadata }) {
    try {
      console.log('🚀 Creating presentation with data:', { userId, title, slideCount, slidesCount: slides?.length || 0 });
      
      // First, create the presentation record
      const presentationData = {
        user_id: userId,
        title,
        description: description || '',
        theme_id: themeId || null,
        amount_of_text: amountOfText || 'detailed',
        image_source: imageSource === 'None' ? 'ai' : (imageSource || 'ai'),
        image_style: imageStyle || '',
        slide_count: slideCount || 5,
        // Note: slides are stored in the separate slides table, not as JSONB
        // Note: metadata column was removed from schema
        is_public: false,
        is_template: false,
        tags: [],
        view_count: 0,
        like_count: 0
      };
      
      console.log('📝 Presentation data to insert:', presentationData);
      
      const { data: presentation, error: presentationError } = await supabase
        .from(TABLES.PRESENTATIONS)
        .insert([presentationData])
        .select()
        .single();

      if (presentationError) {
        console.error('❌ Error creating presentation:', presentationError);
        throw new Error(`Failed to create presentation: ${presentationError.message}`);
      }

      console.log('✅ Presentation created successfully:', presentation.id);

      // Now create individual slide records
      if (slides && slides.length > 0) {
        console.log('📝 Creating slides for presentation:', presentation.id);
        
        const slidePromises = slides.map((slide, index) => {
          // Extract bullets from typingBullets metadata if available
          let bullets = slide.content?.bullets || slide.bullets || [];
          
          // If no bullets in slide content, try to get from metadata.typingBullets
          if ((!bullets || bullets.length === 0) && metadata && metadata.typingBullets) {
            const typingBullets = metadata.typingBullets;
            const slideKey = `${index}-0`; // First bullet for this slide
            const slideBullets = [];
            
            // Extract all bullets for this slide (index-0, index-1, index-2, etc.)
            let bulletIndex = 0;
            while (typingBullets[`${index}-${bulletIndex}`]) {
              const bulletContent = typingBullets[`${index}-${bulletIndex}`];
              if (bulletContent && bulletContent.trim() !== '') {
                slideBullets.push(bulletContent);
              }
              bulletIndex++;
            }
            
            if (slideBullets.length > 0) {
              bullets = slideBullets;
              console.log(`📝 Extracted ${slideBullets.length} bullets from typingBullets for slide ${index}:`, slideBullets);
            }
          }
          
          // If still no bullets, provide defaults
          if (!bullets || bullets.length === 0) {
            bullets = [
              `Key point for ${slide.title || `Slide ${index + 1}`}`,
              'Add more content here',
              'Make your presentation engaging'
            ];
            console.log(`⚠️ Slide ${index + 1} had no bullets, using defaults:`, bullets);
          }
          
          const slideData = {
            presentation_id: presentation.id,
            theme_id: themeId || null,
            title: slide.title || `Slide ${index + 1}`,
            content: JSON.stringify({
              bullets: bullets,
              custom_styling: slide.content?.custom_styling || slide.custom_styling || {},
              theme_info: slide.content?.theme_info || slide.theme_info || {},
              image: slide.content?.image || null
            }),
            layout: slide.layout || 'image-left',
            slide_order: slide.slide_order || index
          };

          console.log(`📝 Creating slide ${index + 1}:`, slideData);

          return supabase
            .from(TABLES.SLIDES)
            .insert([slideData])
            .select()
            .single();
        });

        const slideResults = await Promise.all(slidePromises);
        const slideErrors = slideResults.filter(result => result.error);
        
        if (slideErrors.length > 0) {
          console.warn('⚠️ Some slides failed to create:', slideErrors);
          // Don't fail the entire operation if some slides fail
        } else {
          console.log('✅ All slides created successfully');
        }
      }

      return presentation;
    } catch (error) {
      console.error('❌ Error in Presentation.create:', error);
      throw error;
    }
  }

  static async findById(id, userId) {
    try {
      console.log('🔍 Finding presentation by ID:', id, 'for user:', userId);
      
      // Get presentation metadata
      const { data: presentation, error: presentationError } = await supabase
        .from(TABLES.PRESENTATIONS)
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (presentationError) {
        console.error('❌ Error fetching presentation:', presentationError);
        return null;
      }

      // Get slides for this presentation
      const { data: slides, error: slidesError } = await supabase
        .from(TABLES.SLIDES)
        .select('*')
        .eq('presentation_id', id)
        .order('slide_order', { ascending: true });

      if (slidesError) {
        console.error('❌ Error fetching slides:', slidesError);
        // Return presentation without slides rather than failing
      }

      // Parse slide content
      const parsedSlides = slides?.map(slide => ({
        ...slide,
        content: typeof slide.content === 'string' ? JSON.parse(slide.content) : slide.content
      })) || [];

      return {
        ...presentation,
        slides: parsedSlides
      };
    } catch (error) {
      console.error('❌ Error in Presentation.findById:', error);
      return null;
    }
  }

  static async update(id, userId, updates) {
    try {
      console.log('🔄 Updating presentation:', id, 'with updates:', updates);
      
      // Verify the presentation belongs to the user
      const existingPresentation = await supabase
        .from(TABLES.PRESENTATIONS)
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      
      if (!existingPresentation || existingPresentation.error) {
        throw new Error('Presentation not found or access denied');
      }
      
      const updateData = {};
      
      // Handle basic fields
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.themeId !== undefined) updateData.theme_id = updates.themeId;
      if (updates.amountOfText !== undefined) updateData.amount_of_text = updates.amountOfText;
      if (updates.imageSource !== undefined) updateData.image_source = updates.imageSource === 'None' ? 'ai' : updates.imageSource;
      if (updates.imageStyle !== undefined) updateData.image_style = updates.imageStyle;
      if (updates.slideCount !== undefined) updateData.slide_count = updates.slideCount;
      
      // Handle metadata
      if (updates.metadata !== undefined) {
        updateData.metadata = JSON.stringify(updates.metadata);
      }
      
      // Note: slides are stored in the separate slides table, not as JSONB in presentations
      // The slides column was removed from the schema

      // Update presentation (only if there are fields to update)
      let updatedPresentation = null;
      if (Object.keys(updateData).length > 0) {
        const { data: updateResult, error: updateError } = await supabase
          .from(TABLES.PRESENTATIONS)
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating presentation:', updateError);
          throw new Error(`Failed to update presentation: ${updateError.message}`);
        }
        updatedPresentation = updateResult;
      } else {
        // If no presentation fields to update, just get the current presentation
        const { data: currentPresentation, error: fetchError } = await supabase
          .from(TABLES.PRESENTATIONS)
          .select('*')
          .eq('id', id)
          .single();
          
        if (fetchError) {
          console.error('❌ Error fetching current presentation:', fetchError);
          throw new Error(`Failed to fetch presentation: ${fetchError.message}`);
        }
        updatedPresentation = currentPresentation;
      }

      // If slides were provided, update them
      if (updates.slides && Array.isArray(updates.slides)) {
        console.log('📝 Updating slides for presentation:', id);
        
        // Delete existing slides
        const { error: deleteError } = await supabase
          .from(TABLES.SLIDES)
          .delete()
          .eq('presentation_id', id);

        if (deleteError) {
          console.error('❌ Error deleting existing slides:', deleteError);
        }

        // Insert new slides
        const slidePromises = updates.slides.map((slide, index) => {
          // Extract bullets from typingBullets metadata if available
          let bullets = slide.content?.bullets || slide.bullets || [];
          
          // If no bullets in slide content, try to get from metadata.typingBullets
          if ((!bullets || bullets.length === 0) && updates.metadata && updates.metadata.typingBullets) {
            const typingBullets = updates.metadata.typingBullets;
            const slideBullets = [];
            
            // Extract all bullets for this slide (index-0, index-1, index-2, etc.)
            let bulletIndex = 0;
            while (typingBullets[`${index}-${bulletIndex}`]) {
              const bulletContent = typingBullets[`${index}-${bulletIndex}`];
              if (bulletContent && bulletContent.trim() !== '') {
                slideBullets.push(bulletContent);
              }
              bulletIndex++;
            }
            
            if (slideBullets.length > 0) {
              bullets = slideBullets;
              console.log(`📝 Extracted ${slideBullets.length} bullets from typingBullets for slide ${index}:`, slideBullets);
            }
          }
          
          // If still no bullets, provide defaults
          if (!bullets || bullets.length === 0) {
            bullets = [
              `Key point for ${slide.title || `Slide ${index + 1}`}`,
              'Add more content here',
              'Make your presentation engaging'
            ];
            console.log(`⚠️ Slide ${index + 1} had no bullets, using defaults:`, bullets);
          }
          
          const slideData = {
            presentation_id: id,
            theme_id: updates.themeId || null,
            title: slide.title || `Slide ${index + 1}`,
            content: JSON.stringify({
              bullets: bullets,
              custom_styling: slide.content?.custom_styling || slide.custom_styling || {},
              theme_info: slide.content?.theme_info || slide.theme_info || {},
              image: slide.content?.image || null
            }),
            layout: slide.layout || 'image-left',
            slide_order: slide.slide_order || index
          };

          return supabase
            .from(TABLES.SLIDES)
            .insert([slideData])
            .select()
            .single();
        });

        const slideResults = await Promise.all(slidePromises);
        const slideErrors = slideResults.filter(result => result.error);
        
        if (slideErrors.length > 0) {
          console.warn('⚠️ Some slides failed to update:', slideErrors);
        }
      }

      return updatedPresentation;
    } catch (error) {
      console.error('❌ Error in Presentation.update:', error);
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      console.log('🔍 Finding presentations for user:', userId);
      
      // Get presentations
      const { data: presentations, error: presentationsError } = await supabase
        .from(TABLES.PRESENTATIONS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (presentationsError) {
        console.error('❌ Error fetching presentations:', presentationsError);
        return [];
      }

      // For each presentation, get its slides
      const presentationsWithSlides = await Promise.all(
        presentations.map(async (presentation) => {
          const { data: slides, error: slidesError } = await supabase
            .from(TABLES.SLIDES)
            .select('*')
            .eq('presentation_id', presentation.id)
            .order('slide_order', { ascending: true });

          if (slidesError) {
            console.error('❌ Error fetching slides for presentation:', presentation.id, slidesError);
            return { ...presentation, slides: [] };
          }

          // Parse slide content
          const parsedSlides = slides?.map(slide => ({
            ...slide,
            content: typeof slide.content === 'string' ? JSON.parse(slide.content) : slide.content
          })) || [];

          return {
            ...presentation,
            slides: parsedSlides
          };
        })
      );

      return presentationsWithSlides;
    } catch (error) {
      console.error('❌ Error in Presentation.findByUserId:', error);
      return [];
    }
  }

  static async delete(id) {
    try {
      console.log('🗑️ Deleting presentation:', id);
      
      // Delete associated slides first
      const { error: slidesDeleteError } = await supabase
        .from(TABLES.SLIDES)
        .delete()
        .eq('presentation_id', id);

      if (slidesDeleteError) {
        console.error('❌ Error deleting slides:', slidesDeleteError);
      }

      // Delete associated images
      const { error: imagesDeleteError } = await supabase
        .from(TABLES.PRESENTATION_IMAGES)
        .delete()
        .eq('presentation_id', id);

      if (imagesDeleteError) {
        console.error('❌ Error deleting images:', imagesDeleteError);
      }

      // Delete the presentation
      const { error: presentationDeleteError } = await supabase
        .from(TABLES.PRESENTATIONS)
        .delete()
        .eq('id', id);

      if (presentationDeleteError) {
        console.error('❌ Error deleting presentation:', presentationDeleteError);
        throw new Error(`Failed to delete presentation: ${presentationDeleteError.message}`);
      }

      console.log('✅ Presentation deleted successfully:', id);
      return true;
    } catch (error) {
      console.error('❌ Error in Presentation.delete:', error);
      throw error;
    }
  }

  static async addImage(presentationId, slideId, imageUrl, imageType, altText) {
    try {
      const imageData = {
        presentation_id: presentationId,
        slide_id: slideId,
        image_url: imageUrl,
        image_type: imageType,
        alt_text: altText
      };

      const { data: image, error } = await supabase
        .from(TABLES.PRESENTATION_IMAGES)
        .insert([imageData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding image:', error);
        throw new Error(`Failed to add image: ${error.message}`);
      }

      return image;
    } catch (error) {
      console.error('❌ Error in Presentation.addImage:', error);
      throw error;
    }
  }

  static async getImages(presentationId) {
    try {
      const { data: images, error } = await supabase
        .from(TABLES.PRESENTATION_IMAGES)
        .select('*')
        .eq('presentation_id', presentationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error getting images:', error);
        return [];
      }

      return images;
    } catch (error) {
      console.error('❌ Error in Presentation.getImages:', error);
      return [];
    }
  }
} 