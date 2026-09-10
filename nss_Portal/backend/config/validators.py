from django.core.validators import FileExtensionValidator


image_upload_validator = FileExtensionValidator(
    allowed_extensions=["jpg", "jpeg", "png", "webp"],
    message="Upload a JPG, PNG, or WebP image.",
)
