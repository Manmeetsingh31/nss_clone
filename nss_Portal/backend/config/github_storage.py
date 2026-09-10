"""Server-side Django storage backed by the GitHub Contents API."""

import base64
import json
import logging
import os
from pathlib import PurePosixPath
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from django.core.files.storage import Storage


logger = logging.getLogger(__name__)


class GitHubStorageError(OSError):
    def __init__(self, message, status=None):
        super().__init__(message)
        self.status = status


class GitHubContentsStorage(Storage):
    """Store portal uploads at frontend/images/uploads in GitHub."""

    base_path = "frontend/images/uploads"
    api_base = "https://api.github.com"
    raw_base = "https://raw.githubusercontent.com"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.token = os.environ.get("GITHUB_TOKEN", "")
        self.repository = os.environ.get("GITHUB_REPOSITORY", "")
        self.branch = os.environ.get("GITHUB_BRANCH", "")

    def _full_name(self, name):
        path = PurePosixPath(str(name).replace("\\", "/"))
        if path.is_absolute() or ".." in path.parts:
            raise GitHubStorageError("Invalid image storage path.")
        return str(PurePosixPath(self.base_path) / path)

    def _api_request(self, method, path, payload=None):
        url = f"{self.api_base}{path}"
        data = json.dumps(payload).encode("utf-8") if payload else None
        request = Request(url, data=data, method=method)
        request.add_header("Accept", "application/vnd.github+json")
        request.add_header("User-Agent", "nss-portal-image-storage")
        request.add_header("Authorization", f"Bearer {self.token}")
        if data:
            request.add_header("Content-Type", "application/json")

        try:
            with urlopen(request, timeout=20) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")
            raise GitHubStorageError(
                f"GitHub image storage request failed ({error.code}): {detail}",
                status=error.code,
            ) from error
        except (URLError, TimeoutError) as error:
            raise GitHubStorageError(
                "GitHub image storage is temporarily unavailable."
            ) from error

    def _content_sha(self, full_name):
        path = quote(full_name, safe="/")
        try:
            content = self._api_request(
                "GET",
                f"/repos/{self.repository}/contents/{path}?ref={quote(self.branch)}",
            )
        except GitHubStorageError as error:
            if error.status == 404:
                return None
            raise
        return content.get("sha")

    def _save(self, name, content):
        full_name = self._full_name(name)
        sha = self._content_sha(full_name)
        encoded_content = base64.b64encode(content.read()).decode("ascii")
        payload = {
            "message": f"Upload NSS portal image: {PurePosixPath(name).name}",
            "content": encoded_content,
            "branch": self.branch,
        }
        if sha:
            payload["sha"] = sha
        path = quote(full_name, safe="/")
        self._api_request(
            "PUT",
            f"/repos/{self.repository}/contents/{path}",
            payload,
        )
        return name

    def exists(self, name):
        return self._content_sha(self._full_name(name)) is not None

    def delete(self, name):
        full_name = self._full_name(name)
        sha = self._content_sha(full_name)
        if not sha:
            return
        payload = {
            "message": f"Delete NSS portal image: {PurePosixPath(name).name}",
            "sha": sha,
            "branch": self.branch,
        }
        try:
            path = quote(full_name, safe="/")
            self._api_request(
                "DELETE",
                f"/repos/{self.repository}/contents/{path}",
                payload,
            )
        except GitHubStorageError:
            logger.exception("Unable to delete obsolete GitHub image: %s", full_name)

    def url(self, name):
        full_name = quote(self._full_name(name), safe="/")
        return (
            f"{self.raw_base}/{self.repository}/{quote(self.branch, safe='')}/"
            f"{full_name}"
        )
