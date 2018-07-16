echo "Running Development Servers"

# Kill Running Redis and Dev Servers
sudo fuser -k 6379/tcp
sudo fuser -k 4000/tcp
sudo fuser -k 3000/tcp

# Run Redis, mock-json server, then dev server
sudo docker run -p 6379:6379 redis &
json-server --watch db.json --port 4000 &
npm run dev

