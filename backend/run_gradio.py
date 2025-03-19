#!/usr/bin/env python
"""
Run the WealthSphere Gradio prototype application.
"""
from app.gradio_app import create_app

if __name__ == "__main__":
    app = create_app()
    app.launch() 