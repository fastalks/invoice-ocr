import json
import base64
import aiohttp
from fastapi import UploadFile
from typing import Optional

async def process_invoice(file: UploadFile) -> dict:
    """处理发票识别的核心函数（适配最新返回结构）"""
    try:
        # 读取上传的文件内容并编码
        file_content = await file.read()
        encodestr = base64.b64encode(file_content).decode('utf-8')
        
        # 构建请求数据
        payload = {'img': encodestr}
        
        # 使用aiohttp进行异步HTTP请求
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://ocrapi-invoice.taobao.com/ocrservice/invoice",
                headers={
                    'Authorization': 'APPCODE a74f9ef6a5ea4d6399f5e94c5d1ae49d',
                    'Content-Type': 'application/json; charset=UTF-8'
                },
                json=payload
            ) as response:
                if response.status != 200:
                    error = await response.text()
                    raise Exception(f"OCR API Error: {error}")
                
                result = await response.json()
                data = result.get("data", {})
                
                # 结构化提取关键字段（适配最新返回格式）
                extracted = {
                    # 基础信息
                    "invoice_type": data.get("发票类型", ""),
                    "title": data.get("标题", ""),
                    
                    # 发票标识
                    "invoice_code": data.get("发票代码", ""),
                    "invoice_number": data.get("发票号码", ""),
                    "check_code": data.get("校验码", ""),
                    
                    # 日期金额
                    "invoice_date": format_date(data.get("开票日期", "")),
                    "total_amount": data.get("发票金额", ""),
                    "amount_without_tax": data.get("不含税金额", ""),
                    "tax_amount": data.get("发票税额", ""),
                    "amount_in_words": data.get("大写金额", ""),
                    
                    # 购销双方
                    "seller_name": data.get("销售方名称", ""),
                    "seller_tax_id": data.get("销售方税号", ""),
                    "purchaser_name": data.get("受票方名称", ""),
                    "purchaser_tax_id": data.get("受票方税号", ""),
                    
                    # 商品明细（取第一条作为示例）
                    "items": process_items(data.get("发票详单", [])),
                    
                    # 其他信息
                    "special_mark": data.get("特殊标识信息", ""),
                    "remark": data.get("备注", "")
                }
                
                # 清理空值字段
                return {k: v for k, v in extracted.items() if v}

    except Exception as e:
        raise Exception(f"OCR processing failed: {str(e)}")

def format_date(date_str: str) -> Optional[str]:
    """格式化中文日期到标准格式（2025年09月09日 -> 2025-09-09）"""
    if not date_str:
        return None
    try:
        return date_str.replace("年", "-").replace("月", "-").replace("日", "")
    except:
        return date_str

def process_items(items: list) -> list:
    """处理商品明细列表"""
    return [{
        "name": item.get("货物或应税劳务、服务名称", ""),
        "spec": item.get("规格型号", ""),
        "unit": item.get("单位", ""),
        "quantity": item.get("数量", ""),
        "unit_price": item.get("单价", ""),
        "amount": item.get("金额", ""),
        "tax_rate": item.get("税率", "")
    } for item in items]