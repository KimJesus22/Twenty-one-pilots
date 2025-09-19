const mongoose = require('mongoose');
const User = require('../models/User');
const { Album, Song } = require('../models/Discography');
const Playlist = require('../models/Playlist');

describe('Models', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/twentyonepilots_test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Album.deleteMany({});
    await Song.deleteMany({});
    await Playlist.deleteMany({});
  });

  describe('User Model', () => {
    it('should create user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
      expect(savedUser.role).toBe('user'); // Default role
    });

    it('should hash password before saving', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe(userData.password);
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash pattern
    });

    it('should validate password correctly', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      const isValid = await user.comparePassword('password123');
      const isInvalid = await user.comparePassword('wrongpassword');

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    it('should require unique username', async () => {
      await User.create({
        username: 'testuser',
        email: 'test1@example.com',
        password: 'password123'
      });

      await expect(User.create({
        username: 'testuser', // Duplicate
        email: 'test2@example.com',
        password: 'password123'
      })).rejects.toThrow(/duplicate key/);
    });

    it('should require unique email', async () => {
      await User.create({
        username: 'user1',
        email: 'test@example.com',
        password: 'password123'
      });

      await expect(User.create({
        username: 'user2',
        email: 'test@example.com', // Duplicate
        password: 'password123'
      })).rejects.toThrow(/duplicate key/);
    });

    it('should set admin role', async () => {
      const user = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
      });

      const savedUser = await user.save();
      expect(savedUser.role).toBe('admin');
    });
  });

  describe('Album Model', () => {
    it('should create album with valid data', async () => {
      const albumData = {
        title: 'Test Album',
        releaseYear: 2023,
        coverImage: 'test.jpg'
      };

      const album = new Album(albumData);
      const savedAlbum = await album.save();

      expect(savedAlbum._id).toBeDefined();
      expect(savedAlbum.title).toBe(albumData.title);
      expect(savedAlbum.releaseYear).toBe(albumData.releaseYear);
      expect(savedAlbum.coverImage).toBe(albumData.coverImage);
      expect(savedAlbum.createdAt).toBeDefined();
    });

    it('should require title and releaseYear', async () => {
      const album = new Album({}); // Empty data

      await expect(album.save()).rejects.toThrow(/required/);
    });

    it('should have default songs array', async () => {
      const album = new Album({
        title: 'Test Album',
        releaseYear: 2023
      });

      const savedAlbum = await album.save();
      expect(savedAlbum.songs).toEqual([]);
    });
  });

  describe('Song Model', () => {
    it('should create song with valid data', async () => {
      const album = await Album.create({
        title: 'Test Album',
        releaseYear: 2023
      });

      const songData = {
        title: 'Test Song',
        lyrics: 'Test lyrics',
        duration: '3:45',
        album: album._id
      };

      const song = new Song(songData);
      const savedSong = await song.save();

      expect(savedSong._id).toBeDefined();
      expect(savedSong.title).toBe(songData.title);
      expect(savedSong.lyrics).toBe(songData.lyrics);
      expect(savedSong.duration).toBe(songData.duration);
      expect(savedSong.album.toString()).toBe(album._id.toString());
    });

    it('should require title', async () => {
      const song = new Song({}); // Empty data

      await expect(song.save()).rejects.toThrow(/required/);
    });

    it('should populate album data', async () => {
      const album = await Album.create({
        title: 'Test Album',
        releaseYear: 2023
      });

      const song = await Song.create({
        title: 'Test Song',
        album: album._id
      });

      const populatedSong = await Song.findById(song._id).populate('album');
      expect(populatedSong.album.title).toBe('Test Album');
      expect(populatedSong.album.releaseYear).toBe(2023);
    });
  });

  describe('Playlist Model', () => {
    it('should create playlist with valid data', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      const playlistData = {
        name: 'My Playlist',
        description: 'Test playlist',
        user: user._id,
        isPublic: true
      };

      const playlist = new Playlist(playlistData);
      const savedPlaylist = await playlist.save();

      expect(savedPlaylist._id).toBeDefined();
      expect(savedPlaylist.name).toBe(playlistData.name);
      expect(savedPlaylist.description).toBe(playlistData.description);
      expect(savedPlaylist.user.toString()).toBe(user._id.toString());
      expect(savedPlaylist.isPublic).toBe(true);
      expect(savedPlaylist.songs).toEqual([]);
      expect(savedPlaylist.createdAt).toBeDefined();
    });

    it('should require name and user', async () => {
      const playlist = new Playlist({
        description: 'Test playlist'
      });

      await expect(playlist.save()).rejects.toThrow(/required/);
    });

    it('should have default values', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      const playlist = new Playlist({
        name: 'Test Playlist',
        user: user._id
      });

      const savedPlaylist = await playlist.save();
      expect(savedPlaylist.isPublic).toBe(false); // Default value
      expect(savedPlaylist.songs).toEqual([]);
    });

    it('should populate user data', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      const playlist = await Playlist.create({
        name: 'Test Playlist',
        user: user._id
      });

      const populatedPlaylist = await Playlist.findById(playlist._id).populate('user');
      expect(populatedPlaylist.user.username).toBe('testuser');
      expect(populatedPlaylist.user.email).toBe('test@example.com');
    });
  });
});