#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from twilio.rest import Client
import time
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# Twilio配置
account_sid = os.getenv('TWILIO_ACCOUNT_SID')
auth_token = os.getenv('TWILIO_AUTH_TOKEN')
from_number = os.getenv('TWILIO_PHONE_NUMBER')

# 初始化Twilio客户端
client = Client(account_sid, auth_token)

# 读取电话号码
def read_phone_numbers(file_path):
    with open(file_path, 'r') as file:
        # 读取每行，去除空白字符，并过滤掉空行
        numbers = [line.strip() for line in file if line.strip()]
    return numbers

# 读取短信内容
def read_sms_content(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    return content

# 格式化电话号码为E.164格式
def format_phone_number(phone_number):
    # 移除所有非数字字符
    phone_number = ''.join(filter(str.isdigit, phone_number))
    
    # 如果没有国际前缀，默认添加香港区号(+852)
    if len(phone_number) == 8 and (phone_number.startswith('2') or 
                                 phone_number.startswith('3') or
                                 phone_number.startswith('5') or
                                 phone_number.startswith('6') or
                                 phone_number.startswith('9')):
        phone_number = '852' + phone_number
    
    # 添加'+'前缀
    if not phone_number.startswith('+'):
        phone_number = '+' + phone_number
        
    return phone_number

# 发送短信
def send_sms(to_number, message_template):
    try:
        # 获取手机号码用于显示（不带+和国家代码）
        display_number = to_number
        if display_number.startswith('+'):
            if display_number.startswith('+852'):
                display_number = display_number[4:]  # 移除+852
            else:
                # 尝试移除其他国家代码
                import re
                display_number = re.sub(r'^\+\d+', '', display_number)
        
        # 确保display_number只包含数字
        display_number = ''.join(filter(str.isdigit, display_number))
        
        # 生成密码
        password = f"{display_number}@@jcsfl"
        
        # 替换模板中的变量
        personalized_message = message_template.replace('$手機號碼', display_number)
        
        # 如果有密码变量，也替换它
        if '$密碼' in personalized_message:
            personalized_message = personalized_message.replace('$密碼', password)
        
        # 发送消息
        message = client.messages.create(
            body=personalized_message,
            from_=from_number,
            to=to_number
        )
        print(f"成功发送到 {to_number}, 显示号码: {display_number}, 密码: {password}")
        return True, message.sid
    except Exception as e:
        print(f"发送到 {to_number} 失败: {str(e)}")
        return False, str(e)

# 主函数
def main():
    # 文件路径
    numbers_file = "number.txt"
    sms_content_file = "sms.txt"
    log_file = "sms_log.txt"
    
    # 检查文件是否存在
    if not os.path.exists(numbers_file):
        print(f"错误: 文件 {numbers_file} 不存在")
        return
    
    if not os.path.exists(sms_content_file):
        print(f"错误: 文件 {sms_content_file} 不存在")
        return
    
    # 读取电话号码和短信内容
    phone_numbers = read_phone_numbers(numbers_file)
    sms_content = read_sms_content(sms_content_file)
    
    print(f"读取到 {len(phone_numbers)} 个电话号码")
    print(f"短信内容: \n{sms_content}\n")
    
    # 确认发送
    confirm = input("是否开始发送短信? (y/n): ")
    if confirm.lower() != 'y':
        print("已取消发送")
        return
    
    # 发送结果记录
    success_count = 0
    failed_count = 0
    results = []
    
    # 打开日志文件
    with open(log_file, 'w', encoding='utf-8') as log:
        log.write(f"SMS群发开始时间: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        log.write(f"短信内容: {sms_content}\n\n")
        
        # 发送短信给每个号码
        for idx, number in enumerate(phone_numbers, 1):
            formatted_number = format_phone_number(number)
            print(f"[{idx}/{len(phone_numbers)}] 正在发送到 {formatted_number}...")
            
            success, result = send_sms(formatted_number, sms_content)
            
            if success:
                success_count += 1
                log.write(f"✓ {formatted_number}: 成功 (ID: {result})\n")
            else:
                failed_count += 1
                log.write(f"✗ {formatted_number}: 失败 ({result})\n")
            
            results.append((formatted_number, success, result))
            
            # 防止API限制，每发送5条消息暂停1秒
            if idx % 5 == 0:
                time.sleep(1)
        
        # 写入统计信息
        log.write(f"\n发送统计:\n")
        log.write(f"总计: {len(phone_numbers)}\n")
        log.write(f"成功: {success_count}\n")
        log.write(f"失败: {failed_count}\n")
        log.write(f"完成时间: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    print("\n发送完成!")
    print(f"总计: {len(phone_numbers)}")
    print(f"成功: {success_count}")
    print(f"失败: {failed_count}")
    print(f"详细日志已保存到 {log_file}")

if __name__ == "__main__":
    main() 