# ProCheck OCR System 🚀

Advanced AI-powered identity verification system with state-of-the-art OCR technology for seamless guest registration.

![ProCheck OCR System](https://img.shields.io/badge/Version-1.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- **🤖 Advanced OCR Engine**: Powered by Tesseract.js with enhanced preprocessing
- **🎯 Aadhaar Card Support**: Specialized extraction for Indian identity documents
- **🎨 Modern Dark UI**: Sleek, responsive design with smooth animations
- **⚡ Real-time Processing**: Lightning-fast document analysis and data extraction
- **🔒 Secure & Validated**: Comprehensive validation with rate limiting and security headers
- **📱 Mobile Friendly**: Responsive design that works on all devices
- **🌐 API Ready**: RESTful API for integration with other systems

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone or extract the project**
   ```bash
   cd procheck-ocr-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open your browser and go to: `http://localhost:3000`
   - Upload an Aadhaar card image and watch the magic happen! ✨

### Production Deployment

```bash
# Set environment to production
export NODE_ENV=production

# Start the server
npm start
```

## 📁 Project Structure

```
procheck-ocr-system/
├── public/                 # Frontend assets
│   ├── css/
│   │   └── style.css      # Modern dark theme styles
│   ├── js/
│   │   ├── config.js      # Configuration settings
│   │   ├── utils.js       # Utility functions
│   │   ├── ocr-engine.js  # OCR processing engine
│   │   ├── validation.js  # Form validation
│   │   ├── ui-handler.js  # UI interactions
│   │   └── app.js         # Main application
│   ├── assets/            # Images and icons
│   └── index.html         # Main HTML file
├── server/
│   └── app.js            # Express.js backend server
├── data/                 # JSON data storage
├── logs/                 # Application logs
├── .env                  # Environment variables
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## 🔧 Configuration

The system uses environment variables for configuration. Key settings in `.env`:

```env
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_MAX_REQUESTS=200
MAX_FILE_SIZE=10485760
```

## 🎯 OCR Features

### Supported Documents
- ✅ Aadhaar Cards (Primary focus)
- ✅ PAN Cards
- ✅ Driving Licenses
- ✅ JPG, PNG, PDF formats

### Extracted Fields
- **Name**: Full name extraction without labels
- **Date of Birth**: Multiple date formats supported
- **ID Number**: 12-digit Aadhaar or 16-digit VID
- **Address**: Complete postal address

### Advanced Processing
- Image preprocessing for better accuracy
- Multi-pattern text extraction
- Real-time validation
- Confidence scoring

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Joi and Express-validator
- **Security Headers**: Helmet.js protection
- **CORS Configuration**: Controlled cross-origin access
- **Error Handling**: Secure error responses

## 📊 API Endpoints

### Health Check
```http
GET /api/health
```

### Guest Registration
```http
POST /api/guests
Content-Type: application/json

{
  "fullName": "Harsh Vardhan Kumar Mishra",
  "dateOfBirth": "2004-10-20",
  "idNumber": "741041077539",
  "address": "House No. 223, Hari Nagar, New Delhi - 110044"
}
```

### Get All Guests
```http
GET /api/guests
```

## 🎨 UI Features

### Modern Dark Theme
- Sleek gradient backgrounds
- Smooth animations and transitions
- Responsive design for all screen sizes
- Loading states and progress indicators

### Interactive Elements
- Drag & drop file upload
- Real-time form validation
- Toast notifications
- Modal dialogs
- Animated progress bars

## 🧪 Testing

The system includes comprehensive error handling and validation:

1. **File Validation**: Size, type, and format checks
2. **Data Validation**: Business logic validation
3. **API Testing**: Use the health endpoint to verify connectivity
4. **OCR Testing**: Upload sample Aadhaar cards to test extraction

## 🐛 Troubleshooting

### Common Issues

**OCR not working?**
- Ensure Tesseract.js is loading from CDN
- Check browser console for errors
- Verify file format is supported

**Form submission fails?**
- Check network connectivity
- Verify server is running on port 3000
- Look at browser developer tools for errors

**Styling issues?**
- Clear browser cache
- Check if CSS files are loading
- Verify static file serving

### Debug Mode

Enable detailed logging by setting:
```env
ENABLE_DEBUG_MODE=true
ENABLE_DETAILED_ERRORS=true
```

## 🚀 Performance

### Optimization Features
- Gzip compression
- Static file caching
- Image preprocessing
- Efficient OCR processing
- Minimal bundle size

### Benchmarks
- **OCR Processing**: <3 seconds average
- **Form Validation**: <100ms
- **API Response**: <200ms
- **Page Load**: <2 seconds

## 🔮 Future Enhancements

- [ ] MongoDB integration
- [ ] Multiple language support
- [ ] Batch document processing
- [ ] Advanced analytics dashboard
- [ ] Mobile app version
- [ ] Cloud deployment ready

## 👨‍💻 Development

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- ES6+ JavaScript
- Consistent indentation
- Comprehensive comments
- Error handling
- Security best practices

## 📄 License

MIT License - feel free to use this project for commercial or personal purposes.

## 🙏 Acknowledgments

- **Tesseract.js** for OCR capabilities
- **Express.js** for the backend framework
- **Modern CSS** for the beautiful UI
- **Indian Government** for Aadhaar specifications

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Look at the browser console for errors
3. Verify all dependencies are installed
4. Ensure server is running on correct port

---

**Design & Developed by Harsh Vardhan Kumar Mishra**

*Experience the future of identity verification with ProCheck OCR System! 🚀*