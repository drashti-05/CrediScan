const User = require('./User');
const Document = require('./Document');
const CreditRequest = require('./CreditRequest');

// Define relationships
User.hasMany(Document, {
    foreignKey: 'userId',
    as: 'documents',
    onDelete: 'CASCADE'
});

Document.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

User.hasMany(CreditRequest, {
    foreignKey: 'userId',
    as: 'creditRequests',
    onDelete: 'CASCADE'
});

CreditRequest.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

module.exports = {
    User,
    Document,
    CreditRequest
}; 