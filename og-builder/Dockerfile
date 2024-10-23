# Use an official Rust image that includes the necessary tools for cross-compiling
FROM rust:latest

# Install the Linux target (for x86_64 in this case)
RUN rustup target add x86_64-unknown-linux-gnu

# Install dependencies needed for linking (GCC for Linux)
RUN apt-get update && apt-get install -y \
    gcc-multilib \
    libc6-dev \
    libssl-dev

# Set the working directory
WORKDIR /ogbuilder

# Copy the local project into the container
COPY . .

# Build the project for the target platform
CMD ["cargo", "build", "--release", "--target", "x86_64-unknown-linux-gnu"]
