import { Presentation } from '../models/Presentation.js';
import { Theme } from '../models/Theme.js';

export const createPresentation = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      themeId, 
      amountOfText, 
      imageSource, 
      imageStyle, 
      slideCount, 
      slides, 
      metadata 
    } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!title) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title is required'
      });
    }

    // Create presentation with all the data
    const presentation = await Presentation.create({
      userId,
      title,
      description,
      themeId,
      amountOfText,
      imageSource,
      imageStyle,
      slideCount,
      slides,
      metadata
    });

    res.status(201).json({
      message: 'Presentation created successfully',
      presentation
    });
  } catch (error) {
    console.error('Create presentation error:', error);
    res.status(500).json({
      error: 'Failed to create presentation',
      message: 'Internal server error'
    });
  }
};

export const getPresentations = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 Getting presentations for user:', userId);
    
    const presentations = await Presentation.findByUserId(userId);
    console.log('📊 Found presentations:', presentations.length);
    console.log('📊 Sample presentation:', presentations[0] ? {
      id: presentations[0].id,
      title: presentations[0].title,
      slidesCount: presentations[0].slides?.length || 0
    } : 'No presentations');
    
    res.json({
      message: 'Presentations retrieved successfully',
      presentations
    });
  } catch (error) {
    console.error('Get presentations error:', error);
    res.status(500).json({
      error: 'Failed to get presentations',
      message: 'Internal server error'
    });
  }
};

export const getPresentationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const presentation = await Presentation.findById(id, userId);
    
    if (!presentation) {
      return res.status(404).json({
        error: 'Presentation not found',
        message: 'The requested presentation does not exist'
      });
    }
    
    res.json({
      message: 'Presentation retrieved successfully',
      presentation
    });
  } catch (error) {
    console.error('Get presentation by ID error:', error);
    res.status(500).json({
      error: 'Failed to get presentation',
      message: 'Internal server error'
    });
  }
};

export const updatePresentation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { 
      title, 
      description, 
      themeId, 
      amountOfText, 
      imageSource, 
      imageStyle, 
      slideCount, 
      slides, 
      metadata 
    } = req.body;

    // Validate input
    if (!title && !description && !themeId && !amountOfText && !imageSource && !imageStyle && !slideCount && !slides && !metadata) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'At least one field must be provided for update'
      });
    }

    // Check if presentation exists and belongs to user
    const existingPresentation = await Presentation.findById(id, userId);
    if (!existingPresentation) {
      return res.status(404).json({
        error: 'Presentation not found',
        message: 'The requested presentation does not exist'
      });
    }

    // Update presentation
    const updatedPresentation = await Presentation.update(id, userId, {
      title,
      description,
      theme_id: themeId,
      amount_of_text: amountOfText,
      image_source: imageSource,
      image_style: imageStyle,
      slide_count: slideCount,
      slides,
      metadata
    });

    res.json({
      message: 'Presentation updated successfully',
      presentation: updatedPresentation
    });
  } catch (error) {
    console.error('Update presentation error:', error);
    res.status(500).json({
      error: 'Failed to update presentation',
      message: 'Internal server error'
    });
  }
};

export const deletePresentation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if presentation exists and belongs to user
    const existingPresentation = await Presentation.findById(id, userId);
    if (!existingPresentation) {
      return res.status(404).json({
        error: 'Presentation not found',
        message: 'The requested presentation does not exist'
      });
    }

    // Delete presentation
    await Presentation.delete(id, userId);
    
    res.json({
      message: 'Presentation deleted successfully'
    });
  } catch (error) {
    console.error('Delete presentation error:', error);
    res.status(500).json({
      error: 'Failed to delete presentation',
      message: 'Internal server error'
    });
  }
};

export const addImageToPresentation = async (req, res) => {
  try {
    const { presentationId, slideId } = req.params;
    const { storagePath, imageUrl, altText, imageStyle, promptUsed, isAiGenerated } = req.body;
    const userId = req.user.id;
    
    // Check if presentation exists and belongs to user
    const existingPresentation = await Presentation.findById(presentationId, userId);
    if (!existingPresentation) {
      return res.status(404).json({
        error: 'Presentation not found',
        message: 'The requested presentation does not exist'
      });
    }

    // Add image
    const image = await Presentation.addImage(presentationId, slideId, {
      storagePath,
      imageUrl,
      altText,
      imageStyle,
      promptUsed,
      isAiGenerated
    });
    
    res.json({
      message: 'Image added successfully',
      image
    });
  } catch (error) {
    console.error('Add image error:', error);
    res.status(500).json({
      error: 'Failed to add image',
      message: 'Internal server error'
    });
  }
};

export const getPresentationImages = async (req, res) => {
  try {
    const { presentationId } = req.params;
    const userId = req.user.id;
    
    // Check if presentation exists and belongs to user
    const existingPresentation = await Presentation.findById(presentationId, userId);
    if (!existingPresentation) {
      return res.status(404).json({
        error: 'Presentation not found',
        message: 'The requested presentation does not exist'
      });
    }

    // Get images
    const images = await Presentation.getImages(presentationId);
    
    res.json({
      message: 'Images retrieved successfully',
      images
    });
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({
      error: 'Failed to get images',
      message: 'Internal server error'
    });
  }
}; 