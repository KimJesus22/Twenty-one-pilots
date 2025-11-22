const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// Modelo de Usuario simplificado
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createTestUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email: 'test@test.com' });
        if (existingUser) {
            console.log('⚠️ Usuario de prueba ya existe');
            console.log('📧 Email: test@test.com');
            console.log('🔑 Password: test123');
            await mongoose.disconnect();
            return;
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash('test123', 10);

        // Crear usuario de prueba
        const testUser = new User({
            username: 'testuser',
            email: 'test@test.com',
            password: hashedPassword,
            role: 'user',
            isActive: true
        });

        await testUser.save();

        console.log('✅ Usuario de prueba creado exitosamente!');
        console.log('');
        console.log('📋 Credenciales para login:');
        console.log('📧 Email: test@test.com');
        console.log('🔑 Password: test123');
        console.log('');

        await mongoose.disconnect();
        console.log('✅ Desconectado de MongoDB');
    } catch (error) {
        console.error('❌ Error creando usuario:', error.message);
        process.exit(1);
    }
}

createTestUser();
