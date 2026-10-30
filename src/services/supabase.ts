import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ckwiudmmzevqyersdqfd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrd2l1ZG1temV2cXllcnNkcWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNDUxMzYsImV4cCI6MjEwODkyMTEzNn0.dnkhMe-2TOWtk2MbItGLRLezrA7utVSVnrwCopKhllU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
