import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProjectFile {
  id: string;
  project_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string | null;
}

export const useProjectFiles = (projectId: string | undefined) => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchFiles = useCallback(async () => {
    if (!user || !projectId) {
      setFiles([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFiles((data as ProjectFile[]) || []);
    } catch (error) {
      console.error("Error fetching project files:", error);
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  const uploadFile = async (file: File): Promise<ProjectFile | null> => {
    if (!user || !projectId) return null;

    const filePath = `${user.id}/${projectId}/${Date.now()}_${file.name}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from("project_files")
        .insert({
          project_id: projectId,
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type || file.name.split('.').pop() || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchFiles();
      return data as ProjectFile;
    } catch (error) {
      console.error("Error uploading file:", error);
      return null;
    }
  };

  const deleteFile = async (fileId: string, filePath: string): Promise<boolean> => {
    try {
      const { error: storageError } = await supabase.storage
        .from("project-files")
        .remove([filePath]);

      if (storageError) console.warn("Storage delete warning:", storageError);

      const { error: dbError } = await supabase
        .from("project_files")
        .delete()
        .eq("id", fileId);

      if (dbError) throw dbError;
      await fetchFiles();
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return { files, loading, uploadFile, deleteFile, refetch: fetchFiles };
};
