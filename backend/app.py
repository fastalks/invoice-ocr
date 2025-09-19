from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from ocr_processor import process_invoice

app = FastAPI()

# 允许跨域（前端调试用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/ocr")
async def ocr_invoice(file: UploadFile = File(...)):
    try:
        # 调用阿里云OCR处理（具体实现见ocr_processor.py）
        result = await process_invoice(file)
        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)