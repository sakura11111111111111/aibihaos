# Cloud Server Deployment Guide

This guide explains how to deploy the **Advanced Notes App** to any cloud server (Aliyun, Tencent Cloud, AWS, etc.) using Docker.

## Prerequisites

Your cloud server needs:
1.  **Docker** installed.
2.  **Docker Compose** installed.

## One-Click Deployment

1.  **Upload Files**:
    Copy the entire project folder to your server (e.g., using `scp` or git clone).
    *Key files needed:* `Dockerfile`, `docker-compose.yml`, `server/`, `src/`, `package.json`, etc.

2.  **Run Deployment**:
    SSH into your server, navigate to the project directory, and run:

    ```bash
    docker-compose up -d --build
    ```

3.  **Done!**
    Your app will be running on `http://YOUR_SERVER_IP`.
    
    *   **Frontend & API**: Port 80 (mapped to internal 3000)
    *   **Database**: Managed internally by Docker.

## Troubleshooting

*   **Database Persistence**: Data is stored in the `db_data` Docker volume, so it survives container restarts.
*   **Logs**: Check logs with `docker-compose logs -f`.
*   **Rebuild**: If you update code, run `docker-compose up -d --build` again.
