#!/usr/bin/env python3
import json
import sys
import argparse
import re
from collections import Counter

'''
Invoking this file -
python3 lsp_message_parse.py /tmp/lsp_log/lsp-log-2025-04-30T04-38-21-225Z.jsonl -m textDocument/didOpen -m textDocument/didClose
'''

'''
Invoking LSP in a standalone manner
FlareInput.jsonl
node --nolazy --inspect=6012 --enable-source-maps /Users/dhanak/KiwiFlare/language-servers/app/aws-lsp-codewhisperer-runtimes/out/token-standalone.js --stdio --pre-init-encryption --set-credentials-encryption-key
FlareOutput.jsonl
'''

def unescape_json(escaped_json):
    """
    Unescape a JSON string that has been escaped within another JSON string.
    This handles cases where JSON is nested inside a text field of another JSON object.

    Args:
        escaped_json (str): The escaped JSON string

    Returns:
        dict: The parsed JSON object or the original string if parsing fails
    """
    try:
        # Handle double-escaped quotes and other escape sequences
        # This regex finds escaped backslashes (\\) and escaped quotes (\") and fixes them
        unescaped = re.sub(r'\\([\\"])', r'\1', escaped_json)
        return json.loads(unescaped)
    except json.JSONDecodeError:
        # If it's still not valid JSON, return the original string
        return escaped_json

def parse_jsonrpc_message(json_file=None, method_filters=None, count_methods=False):
    """
    Parse JSON-RPC messages from a file or stdin and print their contents
    in a structured format

    Args:
        json_file (str, optional): Path to JSON file to parse. If None, reads from stdin.
        method_filters (list, optional): If provided, only show messages with methods in this list.
        count_methods (bool, optional): If True, count and display the top methods instead of message details.
    """
    try:
        # Read from file if provided, otherwise from stdin
        if json_file:
            with open(json_file, 'r') as f:
                # Handle both single JSON-RPC message and multiple messages (one per line)
                content = f.read()
                try:
                    # Try parsing as a single JSON object
                    messages = [json.loads(content)]
                except json.JSONDecodeError:
                    # Try parsing as JSONL (one JSON object per line)
                    messages = []
                    for line in content.splitlines():
                        if line.strip():
                            try:
                                messages.append(json.loads(line))
                            except json.JSONDecodeError as e:
                                print(f"Warning: Could not parse line as JSON: {line[:50]}...")
        else:
            # Read from stdin, assuming one JSON object per line
            messages = []
            for line in sys.stdin:
                if line.strip():
                    try:
                        messages.append(json.loads(line))
                    except json.JSONDecodeError as e:
                        print(f"Warning: Could not parse line as JSON: {line[:50]}...")

        # Process messages to extract nested JSON in data field if it exists
        processed_messages = []
        method_counter = Counter()

        for msg in messages:
            # Count method if it exists in the outer message
            if 'method' in msg:
                method_counter[msg['method']] += 1

            if 'data' in msg and isinstance(msg['data'], str):
                try:
                    # Try to parse the data field as JSON
                    data_json = json.loads(msg['data'])
                    # Create a new message that combines the outer and inner JSON
                    combined_msg = {
                        'outer': msg,
                        'inner': data_json
                    }
                    processed_messages.append(combined_msg)

                    # Count method if it exists in the inner JSON
                    if 'method' in data_json:
                        method_counter[data_json['method']] += 1

                except json.JSONDecodeError:
                    # If data is not valid JSON, try to unescape it first
                    try:
                        data_json = unescape_json(msg['data'])
                        if isinstance(data_json, dict):
                            combined_msg = {
                                'outer': msg,
                                'inner': data_json
                            }
                            processed_messages.append(combined_msg)

                            # Count method if it exists in the inner JSON
                            if 'method' in data_json:
                                method_counter[data_json['method']] += 1
                        else:
                            # If still not a dict, keep the original message
                            processed_messages.append({'outer': msg})
                    except Exception:
                        # If all parsing fails, keep the original message
                        processed_messages.append({'outer': msg})
            else:
                processed_messages.append({'outer': msg})

        # If we're just counting methods, display the results and return
        if count_methods:
            print(f"Total messages processed: {len(messages)}")
            print(f"Total methods found: {sum(method_counter.values())}")
            print("\nTop 10 methods:")

            for method, count in method_counter.most_common(10):
                print(f"{method}: {count}")

            return 0

        # Filter messages if method_filters is provided
        filtered_messages = []
        if method_filters:
            # Convert single string to list if needed
            if isinstance(method_filters, str):
                method_filters = [method_filters]

            for msg in processed_messages:
                # Check if method exists in the inner JSON and matches any of the filters
                if ('inner' in msg and 'method' in msg['inner'] and
                    msg['inner']['method'] in method_filters):
                    filtered_messages.append(msg)
                # Also check if method exists in the outer JSON (handles direct method in outer message)
                elif ('outer' in msg and 'method' in msg['outer'] and
                      msg['outer']['method'] in method_filters):
                    filtered_messages.append(msg)

            if not filtered_messages:
                print(f"No messages found with methods: {', '.join(method_filters)}")
                return 0
            print(f"Showing {len(filtered_messages)} message(s) with methods: {', '.join(method_filters)}")
        else:
            filtered_messages = processed_messages

        # Process each message
        for i, msg in enumerate(filtered_messages):
            if i > 0:
                print("\n" + "-" * 40 + "\n")

            print(f"Message {i+1}/{len(filtered_messages)}:")

            # Print outer message details
            outer = msg['outer']
            if 'timestamp' in outer:
                print(f"Timestamp: {outer['timestamp']}")
            if 'direction' in outer:
                print(f"Direction: {outer['direction']}")

            # Print inner message details if available
            if 'inner' in msg:
                inner = msg['inner']

                # Check for JSON-RPC version
                if 'jsonrpc' in inner:
                    print(f"JSON-RPC Version: {inner['jsonrpc']}")

                # Check for method (request)
                if 'method' in inner:
                    print(f"Method: {inner['method']}")

                # Check for id
                if 'id' in inner:
                    print(f"ID: {inner['id']}")




                if 'params' in inner:
                    if 'textDocument' in inner['params']:
                        print(f"Uri: {inner['params']['textDocument']['uri']}")
                        # Only print the text if it's not too long to avoid overwhelming output
                        if 'text' in inner['params']['textDocument']:
                            text = inner['params']['textDocument']['text']
                            if len(text) > 500:  # Limit text display to 500 characters
                                print(f"TextDocument: {text[:500]}... (truncated)")
                            else:
                                print(f"TextDocument: {text}")


                # Format and print all complex fields consistently
                for field in ['params', 'result', 'error']:
                    if field in inner:
                        print(f"\n{field.capitalize()}:")
                        try:
                            # Use a consistent formatting for all complex objects
                            formatted_json = json.dumps(inner[field], indent=2)
                            print(formatted_json)
                        except (TypeError, ValueError):
                            # Fallback if JSON formatting fails
                            print(str(inner[field]))

        return 0
    except FileNotFoundError:
        print(f"Error: File '{json_file}' not found")
        return 1
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1

if __name__ == "__main__":
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Parse JSON-RPC messages from a file or stdin')
    parser.add_argument('file', nargs='?', help='JSON file to parse (if not provided, reads from stdin)')
    parser.add_argument('-m', '--method', action='append', dest='methods',
                        help='Filter messages by method name (can be used multiple times for multiple methods)')
    parser.add_argument('-c', '--stats', action='store_true',
                        help='Display stats about methods in the file')

    args = parser.parse_args()

    # Call the parse function with the provided arguments
    exit(parse_jsonrpc_message(args.file, args.methods, args.stats))
