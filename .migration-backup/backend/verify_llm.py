import os
from openai import OpenAI
from dotenv import load_dotenv

def verify_api():
    # 1. Load Environment Variables
    load_dotenv()
    api_key = os.getenv("NVIDIA_API_KEY")

    if not api_key:
        print("[!] Error: NVIDIA_API_KEY not found in .env file.")
        return

    print(f"[*] Found API Key: {api_key[:10]}...{api_key[-5:]}")

    # 2. Initialize Client
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=api_key,
    )

    print("[*] Connecting to NVIDIA NIM (Nemotron)...")

    try:
        # 3. Simple Completion Test
        completion = client.chat.completions.create(
            model="nvidia/nemotron-3-super-120b-a12b",
            messages=[{"role": "user", "content": "Confirm if you are working. Respond with 'YES, I AM WORKING' and nothing else."}],
            temperature=0.1,
            max_tokens=50,
        )

        response = completion.choices[0].message.content.strip()
        print(f"\n[+] SUCCESS!")
        print(f"[*] LLM Response: {response}")
        print("\nYour API key is valid and the model is responding correctly.")

    except Exception as e:
        print(f"\n[-] FAILED!")
        print(f"Error Details: {str(e)}")
        if "401" in str(e):
            print("Tip: This looks like an invalid API key. Please check your NVIDIA NIM key.")
        elif "404" in str(e):
            print("Tip: The model name might be incorrect or you don't have access to it.")

if __name__ == "__main__":
    verify_api()
