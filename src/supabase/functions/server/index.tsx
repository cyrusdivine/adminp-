import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Sign up route
app.post('/make-server-d491a504/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log(`Sign up error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Sign up error during request processing: ${error}`);
    return c.json({ error: 'Failed to sign up' }, 500);
  }
});

// Send chat message
app.post('/make-server-d491a504/chat/send', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.log(`Chat send authorization error: ${authError?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { message } = await c.req.json();
    const timestamp = Date.now();
    const messageId = `msg_${user.id}_${timestamp}`;

    const chatMessage = {
      id: messageId,
      userId: user.id,
      userName: user.user_metadata?.name || user.email,
      message,
      timestamp,
      isAdmin: false,
    };

    await kv.set(messageId, chatMessage);

    return c.json({ success: true, message: chatMessage });
  } catch (error) {
    console.log(`Chat send error: ${error}`);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// Get chat messages
app.get('/make-server-d491a504/chat/messages', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.log(`Chat messages authorization error: ${authError?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allMessages = await kv.getByPrefix('msg_');
    
    // Filter messages for this user (or admin messages)
    const userMessages = allMessages.filter((msg: any) => 
      msg.userId === user.id || msg.isAdmin
    );

    // Sort by timestamp
    userMessages.sort((a: any, b: any) => a.timestamp - b.timestamp);

    return c.json({ messages: userMessages });
  } catch (error) {
    console.log(`Chat messages fetch error: ${error}`);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

// Admin: Send message to user
app.post('/make-server-d491a504/chat/admin/send', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.log(`Admin chat authorization error: ${authError?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { message, targetUserId } = await c.req.json();
    const timestamp = Date.now();
    const messageId = `msg_admin_${targetUserId}_${timestamp}`;

    const chatMessage = {
      id: messageId,
      userId: targetUserId,
      userName: 'Admin',
      message,
      timestamp,
      isAdmin: true,
    };

    await kv.set(messageId, chatMessage);

    return c.json({ success: true, message: chatMessage });
  } catch (error) {
    console.log(`Admin chat send error: ${error}`);
    return c.json({ error: 'Failed to send admin message' }, 500);
  }
});

// Admin: Get all users with conversations
app.get('/make-server-d491a504/chat/admin/users', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.log(`Admin users authorization error: ${authError?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allMessages = await kv.getByPrefix('msg_');
    
    // Group messages by userId
    const userMap = new Map();
    
    allMessages.forEach((msg: any) => {
      if (!msg.userId || msg.userId === user.id) return; // Skip messages from admin themselves
      
      const existing = userMap.get(msg.userId);
      
      if (!existing || msg.timestamp > existing.lastMessageTime) {
        userMap.set(msg.userId, {
          userId: msg.userId,
          userName: msg.isAdmin ? existing?.userName || 'User' : msg.userName,
          lastMessage: msg.message,
          lastMessageTime: msg.timestamp,
          unreadCount: 0, // Could implement read tracking
        });
      }
    });

    const users = Array.from(userMap.values()).sort((a, b) => b.lastMessageTime - a.lastMessageTime);

    return c.json({ users });
  } catch (error) {
    console.log(`Admin users fetch error: ${error}`);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Admin: Get messages for a specific user
app.get('/make-server-d491a504/chat/admin/messages/:userId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.log(`Admin messages authorization error: ${authError?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const targetUserId = c.req.param('userId');
    const allMessages = await kv.getByPrefix('msg_');
    
    // Filter messages for this specific user
    const userMessages = allMessages.filter((msg: any) => 
      msg.userId === targetUserId
    );

    // Sort by timestamp
    userMessages.sort((a: any, b: any) => a.timestamp - b.timestamp);

    return c.json({ messages: userMessages });
  } catch (error) {
    console.log(`Admin messages fetch error: ${error}`);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

Deno.serve(app.fetch);