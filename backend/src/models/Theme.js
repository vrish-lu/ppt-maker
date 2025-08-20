import { supabase, TABLES } from '../config/supabase.js';

export class Theme {
  static async create(themeData) {
    try {
      const { background_color, text_color, font_family, font_size } = themeData;
      
      const insertData = {
        background_color: background_color || '#ffffff',
        text_color: text_color || '#000000',
        font_family: font_family || 'Arial',
        font_size: font_size || '16px'
      };

      const { data, error } = await supabase
        .from(TABLES.THEMES)
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error creating theme:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from(TABLES.THEMES)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error finding theme by ID:', error);
      return null;
    }
  }

  static async findAll() {
    try {
      const { data, error } = await supabase
        .from(TABLES.THEMES)
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error finding all themes:', error);
      return [];
    }
  }

  static async update(id, updates) {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(TABLES.THEMES)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error updating theme:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const { error } = await supabase
        .from(TABLES.THEMES)
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting theme:', error);
      throw error;
    }
  }
}


