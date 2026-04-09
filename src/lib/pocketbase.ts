import PocketBase from 'pocketbase';

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'https://pb-jp.imm-it.com');
pb.autoCancellation(false);

export default pb;
