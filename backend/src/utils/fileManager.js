import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import crypto from 'crypto';

class FileManager {
  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.checkpointFile = path.join(process.cwd(), 'uploads', '.cleanup-checkpoint.json');
    this.localFilesToCleanup = new Set();
    
    // Ensure uploads directory exists
    this.ensureUploadsDir();
    
    // Load existing checkpoint
    this.loadCheckpoint();
  }

  // Ensure uploads directory exists
  ensureUploadsDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      console.log(`📁 Created uploads directory: ${this.uploadsDir}`);
    }
  }

  // Generate checkpoint ID
  generateCheckpointId() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Load checkpoint from file
  loadCheckpoint() {
    try {
      if (fs.existsSync(this.checkpointFile)) {
        const checkpointData = fs.readFileSync(this.checkpointFile, 'utf8');
        const checkpoint = JSON.parse(checkpointData);
        
        // Restore tracked files from checkpoint
        if (checkpoint.trackedFiles) {
          this.localFilesToCleanup = new Set(checkpoint.trackedFiles);
          console.log(`📋 Loaded checkpoint with ${this.localFilesToCleanup.size} tracked files`);
        }
        
        return checkpoint;
      }
    } catch (error) {
      console.error('❌ Error loading checkpoint:', error);
    }
    return null;
  }

  // Save checkpoint to file
  saveCheckpoint(checkpointId = null) {
    try {
      const checkpoint = {
        id: checkpointId || this.generateCheckpointId(),
        timestamp: new Date().toISOString(),
        trackedFiles: Array.from(this.localFilesToCleanup),
        uploadsDirSize: this.getUploadsDirSizeSync(),
        fileCount: this.getUploadsDirFileCountSync()
      };

      fs.writeFileSync(this.checkpointFile, JSON.stringify(checkpoint, null, 2));
      console.log(`💾 Saved checkpoint: ${checkpoint.id} with ${checkpoint.trackedFiles.length} tracked files`);
      return checkpoint;
    } catch (error) {
      console.error('❌ Error saving checkpoint:', error);
      return null;
    }
  }

  // Track a local file for cleanup
  trackLocalFile(filePath, checkpointId = null) {
    this.localFilesToCleanup.add(filePath);
    console.log(`📁 Tracking local file for cleanup: ${filePath}`);
    
    // Save checkpoint after tracking
    this.saveCheckpoint(checkpointId);
    
    return filePath;
  }

  // Clean up a specific local file
  async cleanupLocalFile(filePath, checkpointId = null) {
    try {
      if (fs.existsSync(filePath)) {
        await fsPromises.unlink(filePath);
        console.log(`🗑️ Cleaned up local file: ${filePath}`);
        
        // Remove from tracking set
        this.localFilesToCleanup.delete(filePath);
        
        // Save checkpoint after cleanup
        this.saveCheckpoint(checkpointId);
        
        return { success: true, filePath };
      } else {
        console.log(`⚠️ File not found for cleanup: ${filePath}`);
        return { success: false, filePath, reason: 'File not found' };
      }
    } catch (error) {
      console.error(`❌ Failed to cleanup local file ${filePath}:`, error);
      return { success: false, filePath, error: error.message };
    }
  }

  // Clean up all tracked local files
  async cleanupAllLocalFiles(checkpointId = null) {
    if (this.localFilesToCleanup.size === 0) {
      console.log('📁 No local files to cleanup');
      return { successful: 0, failed: 0, checkpointId };
    }

    console.log(`🧹 Starting cleanup of ${this.localFilesToCleanup.size} tracked files...`);
    
    const cleanupPromises = Array.from(this.localFilesToCleanup).map(filePath => 
      this.cleanupLocalFile(filePath, checkpointId)
    );
    
    const results = await Promise.allSettled(cleanupPromises);
    
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    const failed = results.filter(result => 
      result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)
    ).length;
    
    console.log(`🧹 Cleanup complete: ${successful} successful, ${failed} failed`);
    
    // Save final checkpoint
    this.saveCheckpoint(checkpointId);
    
    return { successful, failed, checkpointId };
  }

  // Clean up old files in uploads directory (older than specified hours)
  async cleanupOldFiles(hoursOld = 24, checkpointId = null) {
    try {
      const files = await fsPromises.readdir(this.uploadsDir);
      const now = Date.now();
      const cutoffTime = now - (hoursOld * 60 * 60 * 1000);
      
      let cleanedCount = 0;
      let failedCount = 0;
      
      for (const file of files) {
        // Skip checkpoint file and hidden files
        if (file.startsWith('.') || file === '.cleanup-checkpoint.json') {
          continue;
        }
        
        const filePath = path.join(this.uploadsDir, file);
        const stats = await fsPromises.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          const result = await this.cleanupLocalFile(filePath, checkpointId);
          if (result.success) {
            cleanedCount++;
          } else {
            failedCount++;
          }
        }
      }
      
      console.log(`🧹 Cleaned up ${cleanedCount} old files (${failedCount} failed) from uploads directory`);
      return { cleanedCount, failedCount };
    } catch (error) {
      console.error('❌ Error cleaning up old files:', error);
      return { cleanedCount: 0, failedCount: 1 };
    }
  }

  // Get uploads directory size (synchronous)
  getUploadsDirSizeSync() {
    try {
      const files = fs.readdirSync(this.uploadsDir);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = path.join(this.uploadsDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }
      
      return totalSize;
    } catch (error) {
      console.error('❌ Error getting uploads directory size:', error);
      return 0;
    }
  }

  // Get uploads directory file count (synchronous)
  getUploadsDirFileCountSync() {
    try {
      const files = fs.readdirSync(this.uploadsDir);
      return files.length;
    } catch (error) {
      console.error('❌ Error getting uploads directory file count:', error);
      return 0;
    }
  }

  // Get uploads directory size (asynchronous)
  async getUploadsDirSize() {
    try {
      const files = await fsPromises.readdir(this.uploadsDir);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = path.join(this.uploadsDir, file);
        const stats = await fsPromises.stat(filePath);
        totalSize += stats.size;
      }
      
      return totalSize;
    } catch (error) {
      console.error('❌ Error getting uploads directory size:', error);
      return 0;
    }
  }

  // Get storage statistics
  async getStorageStats() {
    const size = await this.getUploadsDirSize();
    const files = await fsPromises.readdir(this.uploadsDir);
    const checkpoint = this.loadCheckpoint();
    
    return {
      uploadsDirectory: {
        fileCount: files.length,
        totalSizeBytes: size,
        totalSizeMB: (size / 1024 / 1024).toFixed(2),
        trackedForCleanup: this.localFilesToCleanup.size
      },
      checkpoint: checkpoint ? {
        id: checkpoint.id,
        timestamp: checkpoint.timestamp,
        trackedFilesCount: checkpoint.trackedFiles?.length || 0
      } : null
    };
  }

  // Log storage statistics
  async logStorageStats() {
    const stats = await this.getStorageStats();
    
    console.log(`📊 Storage Stats:`);
    console.log(`   Files in uploads: ${stats.uploadsDirectory.fileCount}`);
    console.log(`   Total size: ${stats.uploadsDirectory.totalSizeMB} MB`);
    console.log(`   Files tracked for cleanup: ${stats.uploadsDirectory.trackedForCleanup}`);
    
    if (stats.checkpoint) {
      console.log(`   Checkpoint ID: ${stats.checkpoint.id}`);
      console.log(`   Checkpoint time: ${stats.checkpoint.timestamp}`);
    }
  }

  // Get checkpoint information
  getCheckpointInfo() {
    const checkpoint = this.loadCheckpoint();
    return checkpoint;
  }

  // Reset checkpoint (clear all tracking)
  resetCheckpoint() {
    this.localFilesToCleanup.clear();
    this.saveCheckpoint();
    console.log('🔄 Reset checkpoint - cleared all file tracking');
  }

  // Validate checkpoint integrity
  async validateCheckpoint() {
    const checkpoint = this.loadCheckpoint();
    if (!checkpoint) {
      console.log('⚠️ No checkpoint found');
      return { valid: false, reason: 'No checkpoint found' };
    }

    const existingFiles = await fsPromises.readdir(this.uploadsDir);
    const trackedFiles = checkpoint.trackedFiles || [];
    
    // Check if tracked files still exist
    const missingFiles = [];
    const existingTrackedFiles = [];
    
    for (const trackedFile of trackedFiles) {
      if (fs.existsSync(trackedFile)) {
        existingTrackedFiles.push(trackedFile);
      } else {
        missingFiles.push(trackedFile);
      }
    }

    return {
      valid: true,
      checkpointId: checkpoint.id,
      totalTracked: trackedFiles.length,
      existingTracked: existingTrackedFiles.length,
      missingFiles: missingFiles.length,
      missingFileList: missingFiles
    };
  }
}

export default new FileManager(); 