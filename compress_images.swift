import Foundation
import AppKit

let fileManager = FileManager.default
let currentPath = fileManager.currentDirectoryPath
let imageDirPath = currentPath + "/image"

do {
    let files = try fileManager.contentsOfDirectory(atPath: imageDirPath)
    for file in files {
        if file.hasSuffix(".jpg") || file.hasSuffix(".jpeg") || file.hasSuffix(".png") || file.hasSuffix(".webp") {
            let fullPath = imageDirPath + "/" + file
            guard let image = NSImage(contentsOfFile: fullPath) else { continue }
            
            // Calculate new size (max width/height 600)
            let maxSize: CGFloat = 600.0
            var newSize = image.size
            if image.size.width > maxSize || image.size.height > maxSize {
                let ratio = min(maxSize / image.size.width, maxSize / image.size.height)
                newSize = NSSize(width: image.size.width * ratio, height: image.size.height * ratio)
            }
            
            let newImage = NSImage(size: newSize)
            newImage.lockFocus()
            image.draw(in: NSRect(origin: .zero, size: newSize))
            newImage.unlockFocus()
            
            // Save as JPEG with high compression
            if let tiffData = newImage.tiffRepresentation,
               let bitmap = NSBitmapImageRep(data: tiffData),
               let jpegData = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.6]) {
                try jpegData.write(to: URL(fileURLWithPath: fullPath))
                print("Compressed: \(file)")
            }
        }
    }
} catch {
    print("Error: \(error)")
}
